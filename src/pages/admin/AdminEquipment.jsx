import React, { useMemo } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";

const AdminEquipment = () => {
  const items = useMemo(
    () => [
      { id: "EQ-201", name: "Harvester X2", owner: "Kumar", status: "Pending" },
      { id: "EQ-204", name: "Tractor 40HP", owner: "Shyam", status: "Approved" },
      { id: "EQ-210", name: "Sprayer 450L", owner: "Divya", status: "Flagged" },
    ],
    []
  );

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="page-header">
        <div>
          <div className="page-title">Equipment Verification</div>
          <div className="page-subtitle">Review and approve listed equipment.</div>
        </div>
      </div>

      <div className="list-shell">
        <div className="list-grid">
          {items.map((item) => (
            <div key={item.id} className="list-card">
              <div>
                <div className="equipment-name">{item.name}</div>
                <div className="list-meta">
                  {item.id} • Owner: {item.owner}
                </div>
              </div>
              <span
                className={`status-pill ${
                  item.status === "Pending"
                    ? "status-requested"
                    : item.status === "Flagged"
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

export default AdminEquipment;
