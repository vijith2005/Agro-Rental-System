import React from "react";
import { Card, Table, Badge } from "react-bootstrap";
import "../../styles/FarmerDashboard.css";

const DeliveryHistory = () => {
  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Delivery History</div>
      <div className="delivery-subtitle">Review completed and returned deliveries.</div>

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
              <tr>
                <td>R-2102</td>
                <td>Sprayer 450L</td>
                <td>
                  <Badge bg="success">Completed</Badge>
                </td>
                <td>Mar 08</td>
              </tr>
              <tr>
                <td>R-2094</td>
                <td>Water Pump</td>
                <td>
                  <Badge bg="secondary">Returned</Badge>
                </td>
                <td>Mar 03</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DeliveryHistory;
