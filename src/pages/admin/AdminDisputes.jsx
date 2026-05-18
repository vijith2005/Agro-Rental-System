import React, { useMemo } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";

const AdminDisputes = () => {
  const disputes = useMemo(
    () => [
      { id: "DIS-12", issue: "Damage claim on Harvester X2", status: "Open" },
      { id: "DIS-18", issue: "Late return fee - Tractor 35HP", status: "In Review" },
      { id: "DIS-22", issue: "Payment reversal request", status: "Resolved" },
    ],
    []
  );

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="page-header">
        <div>
          <div className="page-title">Disputes & Compliance</div>
          <div className="page-subtitle">Track and resolve open issues across the platform.</div>
        </div>
      </div>

      <div className="list-shell">
        <div className="list-grid">
          {disputes.map((item) => (
            <div key={item.id} className="list-card">
              <div>
                <div className="equipment-name">{item.issue}</div>
                <div className="list-meta">{item.id}</div>
              </div>
              <span
                className={`status-pill ${
                  item.status === "Open"
                    ? "status-requested"
                    : item.status === "In Review"
                    ? "status-pending"
                    : "status-approved"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputes;
