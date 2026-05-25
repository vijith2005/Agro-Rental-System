import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Card, Col, Row, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import PaginationControls from "../../components/PaginationControls";
import "../../styles/FarmerDashboard.css";
import { updateRentalStatus, listRentalsByAgent, sendRentalMessage } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { formatBookingRange } from "../../utils/bookingDates";
import {
  buildFarmerDropRequestText,
  buildOwnerPickupRequestText,
  buildReturnPickupRequestText,
  getFarmerDropLocation,
  getOwnerPickupLocation,
} from "../../utils/rentalLocations";
import {
  markSeenDeliveryReminderIds,
  readSeenDeliveryReminderIds,
  syncDeliveryReminders,
} from "../../utils/deliveryNotifications";

const PAGE_SIZE = 6;
const REMINDER_PAGE_SIZE = 6;

function DeliveryDashboard() {
  const [rentals, setRentals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [reminderPage, setReminderPage] = useState(1);
  const agentKey = getCurrentUser()?.email || "delivery@demo.com";
  const normalizedAgentKey = agentKey.toString().trim().toLowerCase();

  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      try {
        const data = await listRentalsByAgent(agentKey);
        if (!active) return;
        const content = Array.isArray(data) ? data : [];
        setRentals(content);
        setLoadError("");

        const nextReminders = syncDeliveryReminders(content, agentKey, 2);
        setReminders(nextReminders);

        const seenIds = new Set(readSeenDeliveryReminderIds());
        const unseen = nextReminders.filter((reminder) => !seenIds.has(reminder.id));
        if (unseen.length > 0) {
          toast(`You have ${unseen.length} return pickup reminder${unseen.length === 1 ? "" : "s"}.`, {
            icon: "!",
          });
          markSeenDeliveryReminderIds(unseen.map((reminder) => reminder.id));
        }
      } catch {
        if (active) setLoadError("Using cached assignments because the backend is unavailable.");
      }
    };

    loadRentals();
    const onUpdated = () => loadRentals();
    window.addEventListener(RENTAL_UPDATED_EVENT, onUpdated);
    return () => {
      active = false;
      window.removeEventListener(RENTAL_UPDATED_EVENT, onUpdated);
    };
  }, [agentKey]);

  const isReturnTaskAssignedToCurrentAgent = useCallback((rental) => {
    const assignedAgent = (rental?.returnAgentId || rental?.agentId || "").toString().trim().toLowerCase();
    return Boolean(assignedAgent) && assignedAgent === normalizedAgentKey;
  }, [normalizedAgentKey]);

  const summary = useMemo(() => {
    const pickupRequests = rentals.filter((r) => ["REQUESTED", "APPROVED", "SCHEDULED"].includes((r.status || "").toUpperCase())).length;
    const activeDeliveries = rentals.filter((r) => ["SCHEDULED", "IN_TRANSIT", "DELIVERED", "IN_USE"].includes((r.status || "").toUpperCase())).length;
    const returnRequests = rentals.filter(
      (r) =>
        ["DELIVERED", "IN_USE", "RETURN_SCHEDULED"].includes((r.status || "").toUpperCase()) &&
        isReturnTaskAssignedToCurrentAgent(r)
    ).length;
    const completed = rentals.filter((r) => ["RETURNED", "COMPLETED"].includes((r.status || "").toUpperCase())).length;
    return [
      { label: "Pickup requests", value: pickupRequests },
      { label: "Active deliveries", value: activeDeliveries },
      { label: "Return pickups", value: returnRequests },
      { label: "Completed", value: completed },
    ];
  }, [isReturnTaskAssignedToCurrentAgent, rentals]);

  const totalPages = Math.max(1, Math.ceil(rentals.length / PAGE_SIZE));
  const pageItems = rentals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reminderTotalPages = Math.max(1, Math.ceil(reminders.length / REMINDER_PAGE_SIZE));
  const reminderPageItems = reminders.slice(
    (reminderPage - 1) * REMINDER_PAGE_SIZE,
    reminderPage * REMINDER_PAGE_SIZE
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setReminderPage((currentPage) => Math.min(currentPage, reminderTotalPages));
  }, [reminderTotalPages]);

  const requestStage = async (rental, nextStatus, text) => {
    try {
      await sendRentalMessage({ rentalId: rental.id, text });
      const updated = await updateRentalStatus(rental.id, {
        status: nextStatus,
        note: text,
      });
      setRentals((prev) => prev.map((item) => (item.id === rental.id ? updated : item)));
      notifyRentalUpdated();
      toast.success("Request sent.");
    } catch {
      toast.error("Unable to send the delivery request.");
    }
  };

  const getActionMeta = (rental) => {
    const status = (rental.status || "").toUpperCase();
    if (["REQUESTED", "APPROVED"].includes(status)) {
      return {
        label: "Request owner handoff",
        onClick: () => requestStage(rental, "SCHEDULED", buildOwnerPickupRequestText(rental)),
      };
    }
    if (["SCHEDULED"].includes(status)) {
      return {
        label: "Request farmer drop-off",
        onClick: () => requestStage(rental, "IN_TRANSIT", buildFarmerDropRequestText(rental)),
      };
    }
    if (["DELIVERED", "IN_USE"].includes(status)) {
      if (!isReturnTaskAssignedToCurrentAgent(rental)) {
        return null;
      }
      return {
        label: "Request return pickup",
        onClick: () => requestStage(rental, "RETURN_SCHEDULED", buildReturnPickupRequestText(rental)),
      };
    }
    return null;
  };

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Agent Operations</div>
      <div className="delivery-subtitle">Manage owner pickups, farmer drop-offs, and return pickups.</div>
      {loadError && <div className="alert alert-warning mt-3">{loadError}</div>}

      <Row className="g-3 mt-2">
        {summary.map((card) => (
          <Col md={6} lg={3} key={card.label}>
            <Card className="delivery-card shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">{card.label}</div>
                <div className="fs-4 fw-bold mt-2">{card.value}</div>
              </Card.Body>
            </Card>
          </Col>
          ))}
      </Row>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <div>
              <Card.Title className="h6 mb-1">Upcoming Return Pickups</Card.Title>
              <div className="text-muted small">
                These rentals are nearing the end date and need a return pickup from the farmer.
              </div>
            </div>
            <Badge bg="warning" text="dark">
              {reminders.length} due soon
            </Badge>
          </div>
          <div className="row g-2 mt-3">
            {reminders.length === 0 ? (
              <div className="col-12 text-muted small">No return pickup reminders right now.</div>
            ) : (
              reminderPageItems.map((reminder) => (
                <div className="col-md-6 col-lg-4" key={reminder.id}>
                  <div className="border rounded-3 p-3 h-100">
                    <div className="fw-semibold">{reminder.label}</div>
                    <div className="text-muted small mt-1">{reminder.meta}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            currentPage={reminderPage}
            totalPages={reminderTotalPages}
            totalItems={reminders.length}
            pageSize={REMINDER_PAGE_SIZE}
            itemLabel="reminders"
            onPageChange={setReminderPage}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Assigned Rentals</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Booking Date</th>
                <th>Equipment</th>
                <th>Owner Pickup</th>
                <th>Farmer Drop</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No assigned deliveries yet.
                  </td>
                </tr>
              )}
              {pageItems.map((item) => {
                const actionMeta = getActionMeta(item);
                return (
                  <tr key={item.id}>
                    <td>{formatBookingRange(item.startDate, item.endDate)}</td>
                    <td>{item.equipmentName}</td>
                    <td>{getOwnerPickupLocation(item)}</td>
                    <td>{getFarmerDropLocation(item)}</td>
                    <td>
                      <Badge bg={(item.status || "").toUpperCase() === "DELIVERED" ? "success" : "warning"}>
                        {item.status || "SCHEDULED"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      {actionMeta ? (
                        <button className="btn btn-sm btn-warning" onClick={actionMeta.onClick}>
                          {actionMeta.label}
                        </button>
                      ) : (
                        <span className="text-muted small">No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={rentals.length}
            pageSize={PAGE_SIZE}
            itemLabel="rentals"
            onPageChange={setPage}
          />
        </Card.Body>
      </Card>
    </div>
  );
}

export default DeliveryDashboard;
