import React from "react";
import { Card, ProgressBar } from "react-bootstrap";

const AnalyticsChart = ({ title, data = [] }) => {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="h6 mb-3">{title}</Card.Title>
        <div className="analytics-list">
          {data.map((item) => (
            <div key={item.label} className="analytics-row">
              <div className="d-flex justify-content-between small mb-1">
                <span>{item.label}</span>
                <span className="fw-semibold">{item.value}%</span>
              </div>
              <ProgressBar now={item.value} variant={item.variant || "success"} />
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AnalyticsChart;
