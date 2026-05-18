import React from "react";
import { Dropdown, Badge } from "react-bootstrap";

const NotificationDropdown = ({ items = [] }) => {
  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="outline-success" size="sm">
        Notifications <Badge bg="success">{items.length}</Badge>
      </Dropdown.Toggle>
      <Dropdown.Menu className="notification-menu">
        {items.length === 0 && (
          <div className="px-3 py-2 text-muted small">No new notifications</div>
        )}
        {items.map((item) => (
          <Dropdown.Item key={item.id || item.label} className="notification-item">
            <div className="fw-semibold">{item.label}</div>
            {item.meta && <div className="text-muted small">{item.meta}</div>}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;
