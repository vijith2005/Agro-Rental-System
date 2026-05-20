import React, { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import "../../styles/FarmerDashboard.css";
import { addDamageReport, listRentalsByAgent, updateRentalStatus } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";

const DeliveryReturns = () => {
  const [rentals, setRentals] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [damageSeverity, setDamageSeverity] = useState("Minor");
  const [damageNotes, setDamageNotes] = useState("");
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

  const returnRows = rentals.filter((rental) => ["DELIVERED", "IN_USE", "RETURN_SCHEDULED", "SCHEDULED"].includes((rental.status || "").toUpperCase()));

  const submitInspection = async () => {
    if (!selectedId) return;
    try {
      if (damageNotes.trim()) {
        await addDamageReport(selectedId, {
          severity: damageSeverity,
          description: damageNotes,
          photoUrl: "",
        });
      }
      await updateRentalStatus(selectedId, {
        status: damageSeverity.toLowerCase() === "severe" ? "DAMAGED" : "RETURNED",
        note: damageNotes || "Return inspection completed",
      });
      setRentals((prev) =>
        prev.map((item) =>
          item.id === selectedId ? { ...item, status: damageSeverity.toLowerCase() === "severe" ? "DAMAGED" : "RETURNED" } : item
        )
      );
      notifyRentalUpdated();
      setMessage("Return inspection submitted.");
    } catch {
      setMessage("Return inspection failed.");
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
                <th>Rental</th>
                <th>Equipment</th>
                <th>Return Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returnRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No returns scheduled.
                  </td>
                </tr>
              )}
              {returnRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Form.Check
                      type="radio"
                      name="returnRental"
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.schedule?.returnLocation || item.deliveryLocation || "N/A"}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Inspection Form</Card.Title>
          <Form className="mt-3">
            <Form.Group className="mb-2">
              <Form.Label>Severity</Form.Label>
              <Form.Select value={damageSeverity} onChange={(e) => setDamageSeverity(e.target.value)}>
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Severe">Severe</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Damage notes</Form.Label>
              <Form.Control type="text" placeholder="Optional" value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} />
            </Form.Group>
            <Button variant="outline-success" className="w-100" onClick={submitInspection}>
              Submit Inspection
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DeliveryReturns;
