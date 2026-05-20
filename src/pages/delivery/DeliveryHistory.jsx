import React, { useEffect, useState } from "react";
import { Badge, Card, Table } from "react-bootstrap";
import "../../styles/FarmerDashboard.css";
import { listRentalsByAgent } from "../../api/rentalApi";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT } from "../../utils/rentalEvents";

const DeliveryHistory = () => {
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState("");
  const agentKey = getCurrentUser()?.email || "delivery@demo.com";

  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      try {
        const data = await listRentalsByAgent(agentKey);
        if (!active) return;
        setRentals(Array.isArray(data) ? data : []);
      } catch {
        if (active) setMessage("Using cached delivery history because the backend is unavailable.");
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

  const historyRows = rentals.filter((rental) => ["DELIVERED", "RETURNED", "COMPLETED", "DAMAGED"].includes((rental.status || "").toUpperCase()));

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Delivery History</div>
      <div className="delivery-subtitle">Review completed and returned deliveries.</div>
      {message && <div className="alert alert-info mt-3">{message}</div>}

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Completed Deliveries</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Rental</th>
                <th>Equipment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No completed deliveries yet.
                  </td>
                </tr>
              )}
              {historyRows.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.equipmentName}</td>
                  <td>
                    <Badge bg={(item.status || "").toUpperCase() === "DAMAGED" ? "danger" : "success"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>{item.updatedAt || item.createdAt || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DeliveryHistory;
