import React from "react";
import { Card, Table, Form, Button, Row, Col } from "react-bootstrap";
import ImageUpload from "../../components/ImageUpload";
import "../../styles/FarmerDashboard.css";

const DeliveryPickups = () => {
  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Pickup Confirmations</div>
      <div className="delivery-subtitle">Log pickup details and equipment condition.</div>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Scheduled Pickups</Card.Title>
          <Table responsive className="delivery-table mt-3">
            <thead>
              <tr>
                <th>Rental</th>
                <th>Equipment</th>
                <th>Pickup Location</th>
                <th>Pickup Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R-2204</td>
                <td>Tractor 35HP</td>
                <td>Coimbatore</td>
                <td>12:30 PM</td>
              </tr>
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
                  <Form.Control as="textarea" rows={3} />
                </Form.Group>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Fuel level</Form.Label>
                      <Form.Control type="text" placeholder="e.g. 80%" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Machine hours</Form.Label>
                      <Form.Control type="number" placeholder="e.g. 420" />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="success" className="mt-3 w-100">
                  Confirm Pickup
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <ImageUpload label="Pickup Photo Upload" />
        </Col>
      </Row>
    </div>
  );
};

export default DeliveryPickups;
