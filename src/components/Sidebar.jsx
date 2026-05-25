import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { normalizeRole } from "../utils/auth";
import { clearSession } from "../utils/session";
import {
  DELIVERY_REMINDERS_UPDATED_EVENT,
  readDeliveryReminders,
} from "../utils/deliveryNotifications";

const LeafIcon = ({ size = 22, color = "#E9C46A" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M18.5 3.5C12.8 3.1 7.9 6 5.3 10.9c-2 3.9-2 7.7-1.8 9.1a.6.6 0 0 0 .7.5c1.4-.2 5.2-.3 9.1-2.2C18.2 15.7 21 10.8 20.6 5.2a.6.6 0 0 0-.5-.5Z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M6.5 17.5c3.4-2 8.2-6.8 10-12"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const farmerNav = [
  { to: "/farmer", label: "Home", icon: "home" },
  { to: "/farmer/equipment", label: "Equipment", icon: "box" },
  { to: "/farmer/bookings", label: "Bookings", icon: "calendar" },
  { to: "/farmer/payments", label: "Payments", icon: "credit" },
  { to: "/farmer/messages", label: "Messages", icon: "chat" },
  { to: "/farmer/profile", label: "Profile", icon: "user" },
];

const ownerNav = [
  { to: "/owner", label: "Home", icon: "home" },
  { to: "/owner/listings", label: "Listings", icon: "box" },
  { to: "/owner/requests", label: "Requests", icon: "calendar" },
  { to: "/owner/earnings", label: "Earnings", icon: "credit" },
  { to: "/owner/messages", label: "Messages", icon: "chat" },
  { to: "/owner/profile", label: "Profile", icon: "user" },
];

const deliveryNav = [
  { to: "/delivery", label: "Home", icon: "home" },
  { to: "/delivery/deliveries", label: "Deliveries", icon: "box" },
  { to: "/delivery/returns", label: "Returns", icon: "credit" },
  { to: "/delivery/history", label: "History", icon: "user" },
];

const adminNav = [
  { to: "/admin", label: "Home", icon: "home" },
  { to: "/admin/users", label: "Users", icon: "user" },
  { to: "/admin/equipment", label: "Equipment", icon: "box" },
];

const Icon = ({ name }) => {
  const props = { width: 18, height: 18, stroke: "currentColor", fill: "none", strokeWidth: 1.8 };
  switch (name) {
    case "home":
      return <svg {...props} viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5V14H9.5v7H5a1 1 0 0 1-1-1v-9.5Z" /></svg>;
    case "box":
      return <svg {...props} viewBox="0 0 24 24"><path d="m3.5 7 8.5 4 8.5-4M12 21V11" /><path d="m7 4 10 5v11l-10-5V4Z" /></svg>;
    case "calendar":
      return <svg {...props} viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>;
    case "credit":
      return <svg {...props} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
    case "chat":
      return <svg {...props} viewBox="0 0 24 24"><path d="M5 19v-3.5H4a2 2 0 0 1-2-2v-7A2.5 2.5 0 0 1 4.5 4h11A2.5 2.5 0 0 1 18 6.5v7A2.5 2.5 0 0 1 15.5 16h-6L5 19Z" /></svg>;
    case "user":
      return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5" /></svg>;
    default:
      return null;
  }
};

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const displayName = user?.name || user?.email || "Guest";
  const role = normalizeRole(user?.role);
  const [deliveryReminders, setDeliveryReminders] = useState(() => readDeliveryReminders());
  const navItems =
    role === "owner"
      ? ownerNav
      : role === "delivery"
      ? deliveryNav
      : role === "admin"
      ? adminNav
      : farmerNav;

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  useEffect(() => {
    if (role !== "delivery") return undefined;

    const refreshReminders = () => {
      setDeliveryReminders(readDeliveryReminders());
    };

    refreshReminders();
    window.addEventListener(DELIVERY_REMINDERS_UPDATED_EVENT, refreshReminders);
    window.addEventListener("storage", refreshReminders);

    return () => {
      window.removeEventListener(DELIVERY_REMINDERS_UPDATED_EVENT, refreshReminders);
      window.removeEventListener("storage", refreshReminders);
    };
  }, [role]);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="agr-sidebar-fixed">
      <div className="agr-sidebar-header">
        <div className="agr-logo-icon">
          <LeafIcon />
        </div>
        <div>
          <div className="agr-logo-text">AgroConnect</div>
          <div className="agr-logo-sub">Smart Farming Hub</div>
        </div>
      </div>

      <nav className="agr-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `agr-navlink ${isActive ? "active" : ""}`}
            end={["/farmer", "/owner", "/delivery", "/admin"].includes(item.to)}
          >
            <span className="agr-nav-icon"><Icon name={item.icon} /></span>
            <span className="agr-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {role === "delivery" && (
        <div className="agr-user-card agr-delivery-alert-card">
          <div className="agr-delivery-alert-header">
            <div>
              <div className="agr-user-name" style={{ fontSize: 14 }}>Delivery alerts</div>
              <div className="agr-user-role">{deliveryReminders.length} due soon</div>
            </div>
            <div className="agr-delivery-alert-badge">{deliveryReminders.length}</div>
          </div>
          <div className="agr-delivery-alert-list">
            {deliveryReminders.length === 0 ? (
              <div className="agr-delivery-alert-empty">No pickup reminders yet.</div>
            ) : (
              deliveryReminders.slice(0, 2).map((reminder) => (
                <div key={reminder.id} className="agr-delivery-alert-item">
                  <div className="agr-delivery-alert-title">{reminder.label}</div>
                  <div className="agr-delivery-alert-meta">{reminder.meta}</div>
                </div>
              ))
            )}
          </div>
          {deliveryReminders.length > 2 && (
            <div className="agr-delivery-alert-footer">+{deliveryReminders.length - 2} more reminders</div>
          )}
        </div>
      )}

      <div className="agr-user-card">
        <div className="agr-user-avatar">{initials}</div>
          <div className="agr-user-meta">
            <div className="agr-user-name">{displayName}</div>
            <div className="agr-user-role">{role}</div>
          </div>
        <button className="btn btn-sm btn-outline-warning agr-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
