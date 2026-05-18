import React from "react";
import { Card, Col, Row, Table, Badge, Form, Button } from "react-bootstrap";
import ImageUpload from "../../components/ImageUpload";
import "../../styles/FarmerDashboard.css";

function DeliveryDashboard() {
  const summary = [
    { label: "Deliveries today", value: 6 },
    { label: "Completed", value: 18 },
    { label: "Pending pickups", value: 3 },
    { label: "Returns scheduled", value: 4 },
  ];

  const assignments = [
    { id: "R-2204", equipment: "Tractor 35HP", farmer: "Sahana", pickup: "Coimbatore", drop: "Tiruppur", status: "Pickup" },
    { id: "R-2206", equipment: "Combine Harvester", farmer: "Arjun", pickup: "Erode", drop: "Salem", status: "In Transit" },
  ];

  return (
    <div className="agr-page delivery-dashboard motion-page">
      <div className="delivery-title">Delivery Operations</div>
      <div className="delivery-subtitle">Manage pickups, deliveries, and returns with real-time task updates.</div>

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

      <Row className="g-3 mt-1">
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Assigned Deliveries</Card.Title>
              <Table responsive className="delivery-table mt-3">
                <thead>
                  <tr>
                    <th>Rental ID</th>
                    <th>Equipment</th>
                    <th>Farmer</th>
                    <th>Pickup</th>
                    <th>Delivery</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.equipment}</td>
                      <td>{item.farmer}</td>
                      <td>{item.pickup}</td>
                      <td>{item.drop}</td>
                      <td>
                        <Badge bg={item.status === "Pickup" ? "warning" : "success"}>{item.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Route Navigation</Card.Title>
              <div className="route-card mt-3">
                <div className="route-point">
                  <div className="route-dot"></div>
                  <div>
                    <div className="fw-semibold">Pickup</div>
                    <div className="text-muted small">Coimbatore • 12:30 PM</div>
                  </div>
                </div>
                <div className="route-line"></div>
                <div className="route-point">
                  <div className="route-dot"></div>
                  <div>
                    <div className="fw-semibold">Drop-off</div>
                    <div className="text-muted small">Tiruppur • ETA 2:15 PM</div>
                  </div>
                </div>
                <div className="route-meta">Distance 42 km • ETA 1h 45m</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Pickup Confirmation</Card.Title>
              <Form className="mt-3">
                <Form.Group className="mb-2">
                  <Form.Label>Equipment condition</Form.Label>
                  <Form.Control as="textarea" rows={2} placeholder="Describe current condition" />
                </Form.Group>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Fuel level</Form.Label>
                      <Form.Control type="text" placeholder="e.g. 70%" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Machine hours</Form.Label>
                      <Form.Control type="number" placeholder="e.g. 450" />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="success" className="mt-3 w-100">Confirm Pickup</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Delivery Confirmation</Card.Title>
              <Form className="mt-3">
                <Form.Group className="mb-2">
                  <Form.Label>Delivery timestamp</Form.Label>
                  <Form.Control type="datetime-local" />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Farmer signature</Form.Label>
                  <Form.Control type="text" placeholder="Collected digitally" />
                </Form.Group>
                <Button variant="success" className="w-100">Confirm Delivery</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={6}>
          <ImageUpload label="Upload Pickup Photos" />
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Return Inspection</Card.Title>
              <Form className="mt-3">
                <Form.Group className="mb-2">
                  <Form.Label>Condition report</Form.Label>
                  <Form.Control as="textarea" rows={2} placeholder="Describe any damage" />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Damage notes</Form.Label>
                  <Form.Control type="text" placeholder="Add notes" />
                </Form.Group>
                <Button variant="outline-success" className="w-100">Submit Inspection</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Delivery History</Card.Title>
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
                <td><Badge bg="success">Completed</Badge></td>
                <td>Mar 08</td>
              </tr>
              <tr>
                <td>R-2094</td>
                <td>Water Pump</td>
                <td><Badge bg="secondary">Returned</Badge></td>
                <td>Mar 03</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default DeliveryDashboard;
