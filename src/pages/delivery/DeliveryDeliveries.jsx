import React, { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import "../../styles/FarmerDashboard.css";
import { listRentalsByAgent, updateRentalStatus } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";

const DeliveryDeliveries = () => {
  const [rentals, setRentals] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [farmerSignature, setFarmerSignature] = useState("");
  const [message, setMessage] = useState("");
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

  const deliveryRows = rentals.filter((rental) => ["IN_TRANSIT", "SCHEDULED"].includes((rental.status || "").toUpperCase()));

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
    } catch {
      setMessage("Delivery update failed.");
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
                <th>Rental</th>
                <th>Equipment</th>
                <th>Delivery Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No deliveries scheduled.
                  </td>
                </tr>
              )}
              {deliveryRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Form.Check
                      type="radio"
                      name="deliveryRental"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.schedule?.deliveryLocation || item.deliveryLocation || "N/A"}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
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
            <Button variant="success" className="w-100" onClick={confirmDelivery}>
              Confirm Delivery
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DeliveryDeliveries;
