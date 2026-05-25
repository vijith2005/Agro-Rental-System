import React, { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import PaginationControls from "../../components/PaginationControls";
import "../../styles/FarmerDashboard.css";
import { listRentalsByAgent, sendRentalMessage, updateRentalStatus } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { formatBookingRange } from "../../utils/bookingDates";
import {
  buildFarmerDropRequestText,
  getFarmerDropLocation,
  getOwnerPickupLocation,
} from "../../utils/rentalLocations";

const PAGE_SIZE = 5;

const DeliveryDeliveries = () => {
  const [rentals, setRentals] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [farmerSignature, setFarmerSignature] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const agentKey = getCurrentUser()?.email || "delivery@demo.com";

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
        if (active) setMessage("Using cached delivery assignments because the backend is unavailable.");
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

  const deliveryRows = rentals.filter((rental) => ["SCHEDULED", "IN_TRANSIT"].includes((rental.status || "").toUpperCase()));
  const totalPages = Math.max(1, Math.ceil(deliveryRows.length / PAGE_SIZE));
  const pageItems = deliveryRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (deliveryRows.length === 0) return;
    setSelectedId((prev) => (deliveryRows.some((item) => item.id === prev) ? prev : deliveryRows[0].id));
  }, [deliveryRows]);

  const selectedRental = rentals.find((item) => item.id === selectedId) || null;

  const requestFarmerDrop = async () => {
    if (!selectedRental) return;
    try {
      await sendRentalMessage({
        rentalId: selectedRental.id,
        text: buildFarmerDropRequestText(selectedRental),
      });
      const updated = await updateRentalStatus(selectedRental.id, {
        status: "IN_TRANSIT",
        note: "Farmer drop-off requested by delivery agent",
      });
      setRentals((prev) => prev.map((item) => (item.id === selectedId ? updated : item)));
      notifyRentalUpdated();
      toast.success("Farmer drop-off request sent.");
    } catch {
      toast.error("Unable to send farmer drop-off request.");
    }
  };

  const confirmDelivery = async () => {
    if (!selectedId) return;
    try {
      await updateRentalStatus(selectedId, {
        status: "DELIVERED",
        note: `Delivered at ${deliveryTime || "unspecified time"}. ${farmerSignature ? `Farmer: ${farmerSignature}` : ""}`,
      });
      setRentals((prev) => prev.map((item) => (item.id === selectedId ? { ...item, status: "DELIVERED" } : item)));
      notifyRentalUpdated();
      setMessage("Delivery confirmed.");
      toast.success("Delivery confirmed.");
    } catch {
      setMessage("Delivery update failed.");
      toast.error("Delivery update failed.");
    }
  };

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Delivery Confirmations</div>
      <div className="delivery-subtitle">Capture delivery proof and signature details.</div>
      {message && <div className="alert alert-info mt-3">{message}</div>}

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Scheduled Drop-offs</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Select</th>
                <th>Booking Date</th>
                <th>Equipment</th>
                <th>Owner</th>
                <th>Farmer</th>
                <th>Owner Pickup</th>
                <th>Farmer Drop</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No deliveries scheduled.
                  </td>
                </tr>
              )}
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Form.Check
                      type="radio"
                      name="deliveryRental"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                    />
                  </td>
                  <td>{formatBookingRange(item.startDate, item.endDate)}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.ownerName || item.ownerId || "Owner"}</td>
                  <td>{item.farmerName || item.farmerId || "Farmer"}</td>
                  <td>{getOwnerPickupLocation(item)}</td>
                  <td>{getFarmerDropLocation(item)}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={deliveryRows.length}
            pageSize={PAGE_SIZE}
            itemLabel="deliveries"
            onPageChange={setPage}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Delivery Form</Card.Title>
          <Form className="mt-3">
            <Form.Group className="mb-2">
              <Form.Label>Delivery timestamp</Form.Label>
              <Form.Control type="datetime-local" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Farmer signature</Form.Label>
              <Form.Control type="text" value={farmerSignature} onChange={(e) => setFarmerSignature(e.target.value)} />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button variant="outline-warning" className="w-50" type="button" onClick={requestFarmerDrop} disabled={!selectedRental}>
                Request Farmer Drop-off
              </Button>
              <Button variant="success" className="w-50" type="button" onClick={confirmDelivery} disabled={!selectedRental}>
                Confirm Delivery
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DeliveryDeliveries;
