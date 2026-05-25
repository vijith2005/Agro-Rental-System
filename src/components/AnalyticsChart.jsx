import React from "react";
import { Card } from "react-bootstrap";

const defaultFormatter = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0);

const AnalyticsChart = ({ title, subtitle, data = [], formatValue = defaultFormatter, emptyMessage = "No data available yet." }) => {
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  const totalValue = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <Card className="shadow-sm h-100 admin-chart-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <Card.Title className="h6 mb-1">{title}</Card.Title>
            {subtitle && <div className="text-muted small">{subtitle}</div>}
          </div>
          <div className="text-end small text-muted">
            <div>Total</div>
            <div className="fw-semibold text-dark">{formatValue(totalValue)}</div>
          </div>
        </div>

        <div className="analytics-list">
          {data.length === 0 && <div className="text-muted small py-2">{emptyMessage}</div>}
          {data.map((item) => {
            const value = Number(item.value) || 0;
            const width = `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`;

            return (
              <div key={item.label} className="analytics-row">
                <div className="d-flex justify-content-between align-items-center small mb-1 gap-3">
                  <span className="analytics-label">{item.label}</span>
                  <span className="fw-semibold">{formatValue(value)}</span>
                </div>
                <div className="analytics-track" aria-hidden="true">
                  <div
                    className="analytics-fill"
                    style={{
                      width,
                      background: item.color || undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AnalyticsChart;
