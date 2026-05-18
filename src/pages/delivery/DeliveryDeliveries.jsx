import React from "react";
import { Card, Form, Button, Table } from "react-bootstrap";
import ImageUpload from "../../components/ImageUpload";
import "../../styles/FarmerDashboard.css";

const DeliveryDeliveries = () => {
  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Delivery Confirmations</div>
      <div className="delivery-subtitle">Capture delivery proof and signatures.</div>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Scheduled Drop-offs</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Rental</th>
                <th>Equipment</th>
                <th>Delivery Location</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R-2206</td>
                <td>Combine Harvester</td>
                <td>Salem</td>
                <td>2:15 PM</td>
              </tr>
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
              <Form.Control type="datetime-local" />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Farmer signature</Form.Label>
              <Form.Control type="text" placeholder="Captured digitally" />
            </Form.Group>
            <Button variant="success" className="w-100">
              Confirm Delivery
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className="mt-3">
        <ImageUpload label="Delivery Photo Upload" />
      </div>
    </div>
  );
};

export default DeliveryDeliveries;
