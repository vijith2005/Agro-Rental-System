import React from "react";
import { Card, Form, Button, Row, Col } from "react-bootstrap";

const BookingForm = ({ onSubmit }) => {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="h6 mb-3">Book Equipment</Card.Title>
        <Form onSubmit={onSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control type="date" required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control type="date" required />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Delivery Location</Form.Label>
                <Form.Control type="text" placeholder="Village, district" required />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Any special instructions" />
              </Form.Group>
            </Col>
          </Row>
          <Button type="submit" variant="success" className="mt-3 w-100">
            Confirm Booking
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default BookingForm;
