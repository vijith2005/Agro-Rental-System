import React from "react";
import { Card, Form, Button, Table } from "react-bootstrap";
import ImageUpload from "../../components/ImageUpload";
import "../../styles/FarmerDashboard.css";

const DeliveryReturns = () => {
  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Return Inspections</div>
      <div className="delivery-subtitle">Inspect returned equipment and report damage.</div>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Scheduled Returns</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Rental</th>
                <th>Equipment</th>
                <th>Return Location</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R-2190</td>
                <td>Sprayer 450L</td>
                <td>Namakkal</td>
                <td>Mar 12</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Inspection Form</Card.Title>
          <Form className="mt-3">
            <Form.Group className="mb-2">
              <Form.Label>Condition report</Form.Label>
              <Form.Control as="textarea" rows={3} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Damage notes</Form.Label>
              <Form.Control type="text" placeholder="Optional" />
            </Form.Group>
            <Button variant="outline-success" className="w-100">
              Submit Inspection
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className="mt-3">
        <ImageUpload label="Return Inspection Photos" />
      </div>
    </div>
  );
};

export default DeliveryReturns;
