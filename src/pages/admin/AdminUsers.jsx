import React, { useMemo } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";

const AdminUsers = () => {
  const users = useMemo(
    () => [
      { name: "Kumar", email: "kumar@demo.com", role: "Owner", status: "Verified" },
      { name: "Priya", email: "priya@demo.com", role: "Farmer", status: "Active" },
      { name: "Arun", email: "arun@demo.com", role: "Delivery", status: "Onboarded" },
      { name: "Sara", email: "sara@demo.com", role: "Owner", status: "Pending" },
    ],
    []
  );

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="page-header">
        <div>
          <div className="page-title">User Directory</div>
          <div className="page-subtitle">Manage roles, verification, and status.</div>
        </div>
      </div>

      <div className="list-shell">
        <div className="list-grid">
          {users.map((user) => (
            <div key={user.email} className="list-card">
              <div>
                <div className="equipment-name">{user.name}</div>
                <div className="list-meta">
                  {user.email} • {user.role}
                </div>
              </div>
              <span className={`status-pill ${user.status === "Pending" ? "status-requested" : "status-approved"}`}>
                {user.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
