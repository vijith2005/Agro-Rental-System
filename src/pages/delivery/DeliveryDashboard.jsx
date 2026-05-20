import React, { useEffect, useMemo, useState } from "react";
import { Badge, Card, Col, Row, Table } from "react-bootstrap";
import "../../styles/FarmerDashboard.css";
import { listRentalsByAgent } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT } from "../../utils/rentalEvents";

function DeliveryDashboard() {
  const [rentals, setRentals] = useState([]);
  const [loadError, setLoadError] = useState("");
  const agentKey = getCurrentUser()?.email || "delivery@demo.com";

  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      try {
        const data = await listRentalsByAgent(agentKey);
        if (!active) return;
        setRentals(Array.isArray(data) ? data : []);
        setLoadError("");
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

  const summary = useMemo(() => {
    const delivered = rentals.filter((r) => (r.status || "").toUpperCase() === "DELIVERED").length;
    const activeDeliveries = rentals.filter((r) => ["SCHEDULED", "IN_TRANSIT", "DELIVERED", "IN_USE"].includes((r.status || "").toUpperCase())).length;
    const pendingPickups = rentals.filter((r) => (r.status || "").toUpperCase() === "SCHEDULED").length;
    const returns = rentals.filter((r) => ["RETURN_SCHEDULED", "RETURNED", "COMPLETED"].includes((r.status || "").toUpperCase())).length;
    return [
      { label: "Deliveries assigned", value: rentals.length },
      { label: "Active deliveries", value: activeDeliveries },
      { label: "Completed", value: delivered },
      { label: "Returns scheduled", value: returns || pendingPickups },
    ];
  }, [rentals]);

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Agent Operations</div>
      <div className="delivery-subtitle">Manage pickups, deliveries, usage logs, and return inspections.</div>
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
          <Card.Title className="h6">Assigned Rentals</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Rental ID</th>
                <th>Equipment</th>
                <th>Farmer</th>
                <th>Pickup</th>
                <th>Drop</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rentals.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No assigned deliveries yet.
                  </td>
                </tr>
              )}
              {rentals.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.farmerName || item.farmerId}</td>
                  <td>{item.schedule?.pickupDateTime || item.pickupLocation || "N/A"}</td>
                  <td>{item.schedule?.deliveryLocation || item.deliveryLocation || "N/A"}</td>
                  <td>
                    <Badge bg={(item.status || "").toUpperCase() === "DELIVERED" ? "success" : "warning"}>
                      {item.status || "SCHEDULED"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default DeliveryDashboard;
