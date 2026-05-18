import React from "react";
import { Card, Badge, Button } from "react-bootstrap";

const EquipmentCard = ({
  image,
  name,
  pricePerDay,
  available,
  rating,
  brand,
  onView,
  onBook,
}) => {
  return (
    <Card className="equipment-card shadow-sm h-100">
      <div
        className="equipment-card-image"
        style={{ backgroundImage: `url(${image})` }}
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <Card.Title className="h6 mb-1">{name}</Card.Title>
            {brand && <div className="text-muted small">{brand}</div>}
          </div>
          <Badge bg={available ? "success" : "secondary"}>
            {available ? "Available" : "Booked"}
          </Badge>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="fw-semibold">?{pricePerDay}/day</div>
          <div className="text-warning small">? {rating}</div>
        </div>
        <div className="d-flex gap-2 mt-auto pt-3">
          {onView && (
            <Button variant="outline-success" size="sm" onClick={onView}>
              Details
            </Button>
          )}
          {onBook && (
            <Button variant="success" size="sm" onClick={onBook}>
              Book Now
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default EquipmentCard;
