import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import "../../styles/FarmerDashboard.css";
import { addUsageLog, listRentalsByAgent, updateRentalStatus } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";

const DeliveryPickups = () => {
  const [rentals, setRentals] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [condition, setCondition] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [machineHours, setMachineHours] = useState("");
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

  const pickupRows = rentals.filter((rental) => ["SCHEDULED", "APPROVED"].includes((rental.status || "").toUpperCase()));

  const confirmPickup = async () => {
    if (!selectedId) return;
    try {
      await addUsageLog(selectedId, {
        details: condition || "Pickup confirmed",
        machineHours: machineHours ? Number(machineHours) : undefined,
        fuelLevel: fuelLevel ? Number(fuelLevel) : undefined,
      });
      const updated = await updateRentalStatus(selectedId, {
        status: "IN_TRANSIT",
        note: "Pickup confirmed by delivery agent",
      });
      setRentals((prev) => prev.map((item) => (item.id === selectedId ? updated : item)));
      notifyRentalUpdated();
      setMessage("Pickup confirmed.");
    } catch {
      setMessage("Pickup update failed.");
    }
  };

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Pickup Confirmations</div>
      <div className="delivery-subtitle">Log pickup details and equipment condition.</div>
      {message && <div className="alert alert-info mt-3">{message}</div>}

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Scheduled Pickups</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Select</th>
                <th>Rental</th>
                <th>Equipment</th>
                <th>Pickup Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pickupRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No pickups scheduled.
                  </td>
                </tr>
              )}
              {pickupRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Form.Check
                      type="radio"
                      name="pickupRental"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.schedule?.pickupLocation || item.pickupLocation || "N/A"}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Row className="g-3 mt-1">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Pickup Form</Card.Title>
              <Form className="mt-3">
                <Form.Group className="mb-2">
                  <Form.Label>Condition report</Form.Label>
                  <Form.Control as="textarea" rows={3} value={condition} onChange={(e) => setCondition(e.target.value)} />
                </Form.Group>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Fuel level</Form.Label>
                      <Form.Control type="text" placeholder="e.g. 80%" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Machine hours</Form.Label>
                      <Form.Control type="number" placeholder="e.g. 420" value={machineHours} onChange={(e) => setMachineHours(e.target.value)} />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="success" className="mt-3 w-100" onClick={confirmPickup}>
                  Confirm Pickup
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DeliveryPickups;
