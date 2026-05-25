import React, { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import PaginationControls from "../../components/PaginationControls";
import "../../styles/FarmerDashboard.css";
import { addDamageReport, listRentalsByAgent, sendRentalMessage, updateRentalStatus } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { formatBookingRange } from "../../utils/bookingDates";
import {
  buildReturnPickupRequestText,
  getFarmerDropLocation,
} from "../../utils/rentalLocations";

const PAGE_SIZE = 5;

const DeliveryReturns = () => {
  const [rentals, setRentals] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [damageSeverity, setDamageSeverity] = useState("None");
  const [damageNotes, setDamageNotes] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
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
        setSelectedId((prev) => prev || content[0]?.id || "");
      } catch {
        if (active) setMessage("Using cached return assignments because the backend is unavailable.");
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

  const isReturnTaskAssignedToCurrentAgent = (rental) => {
    const assignedAgent = (rental?.returnAgentId || rental?.agentId || "").toString().trim().toLowerCase();
    return Boolean(assignedAgent) && assignedAgent === normalizedAgentKey;
  };

  const returnRows = rentals.filter((rental) =>
    ["DELIVERED", "IN_USE", "RETURN_SCHEDULED", "SCHEDULED"].includes((rental.status || "").toUpperCase()) &&
    isReturnTaskAssignedToCurrentAgent(rental)
  );
  const totalPages = Math.max(1, Math.ceil(returnRows.length / PAGE_SIZE));
  const pageItems = returnRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (returnRows.length === 0) return;
    setSelectedId((prev) => (returnRows.some((item) => item.id === prev) ? prev : returnRows[0].id));
  }, [returnRows]);

  const selectedRental = rentals.find((item) => item.id === selectedId) || null;

  const requestReturnPickup = async () => {
    if (!selectedRental) return;
    try {
      await sendRentalMessage({
        rentalId: selectedRental.id,
        text: buildReturnPickupRequestText(selectedRental),
      });
      const updated = await updateRentalStatus(selectedRental.id, {
        status: "RETURN_SCHEDULED",
        note: "Return pickup requested by delivery agent",
      });
      setRentals((prev) => prev.map((item) => (item.id === selectedId ? updated : item)));
      notifyRentalUpdated();
      toast.success("Return pickup request sent.");
    } catch {
      toast.error("Unable to send return pickup request.");
    }
  };

  const submitInspection = async () => {
    if (!selectedId) return;
    try {
      const normalizedSeverity = damageSeverity.toLowerCase();
      const hasDamage = normalizedSeverity !== "none";

      if (hasDamage && damageNotes.trim()) {
        await addDamageReport(selectedId, {
          severity: damageSeverity,
          description: damageNotes,
          photoUrl: "",
        });
      }
      await updateRentalStatus(selectedId, {
        status: normalizedSeverity === "severe" ? "DAMAGED" : "RETURNED",
        note: damageNotes || (hasDamage ? "Return inspection completed with damage noted" : "Return inspection completed with no damage"),
      });
      setRentals((prev) =>
        prev.map((item) =>
          item.id === selectedId ? { ...item, status: normalizedSeverity === "severe" ? "DAMAGED" : "RETURNED" } : item
        )
      );
      notifyRentalUpdated();
      setMessage("Return inspection submitted.");
      toast.success("Return inspection submitted.");
    } catch {
      setMessage("Return inspection failed.");
      toast.error("Return inspection failed.");
    }
  };

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Return Inspections</div>
      <div className="delivery-subtitle">Inspect returned equipment and report damage.</div>
      {message && <div className="alert alert-info mt-3">{message}</div>}

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Scheduled Returns</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Select</th>
                <th>Booking Date</th>
                <th>Equipment</th>
                <th>Owner</th>
                <th>Farmer</th>
                <th>Farmer Return Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No returns scheduled.
                  </td>
                </tr>
              )}
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Form.Check
                      type="radio"
                      name="returnRental"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                    />
                  </td>
                  <td>{formatBookingRange(item.startDate, item.endDate)}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.ownerName || item.ownerId || "Owner"}</td>
                  <td>{item.farmerName || item.farmerId || "Farmer"}</td>
                  <td>{getFarmerDropLocation(item)}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={returnRows.length}
            pageSize={PAGE_SIZE}
            itemLabel="returns"
            onPageChange={setPage}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Inspection Form</Card.Title>
          <Form className="mt-3">
            <Form.Group className="mb-2">
              <Form.Label>Severity</Form.Label>
              <Form.Select value={damageSeverity} onChange={(e) => setDamageSeverity(e.target.value)}>
                <option value="None">None</option>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Severe">Severe</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Damage notes</Form.Label>
              <Form.Control
                type="text"
                placeholder="Optional"
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button variant="outline-warning" className="w-50" type="button" onClick={requestReturnPickup} disabled={!selectedRental}>
                Request Return Pickup
              </Button>
              <Button variant="outline-success" className="w-50" type="button" onClick={submitInspection} disabled={!selectedRental}>
                Submit Inspection
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DeliveryReturns;
