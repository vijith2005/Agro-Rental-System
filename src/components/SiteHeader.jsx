import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getStored, STORAGE_KEYS } from "../utils/storage";

const SiteHeader = () => {
  const location = useLocation();
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser")) ||
    JSON.parse(localStorage.getItem("user"));

  const role = currentUser?.role || "guest";
  const displayName = currentUser?.name || currentUser?.email?.split("@")[0] || "Guest";
  const userId = currentUser?.email || "user@demo.com";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const threads = getStored(STORAGE_KEYS.chats, []);
      const total = threads
        .filter((t) => (role === "owner" ? t.ownerId === userId : t.farmerId === userId))
        .reduce(
          (sum, t) =>
            sum + (role === "owner" ? t.unreadForOwner || 0 : t.unreadForFarmer || 0),
          0
        );
      setUnreadCount(total);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("chats-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("chats-updated", sync);
    };
  }, [role, userId]);

  const navLinks = useMemo(() => {
    if (role === "farmer") {
      return [
        { to: "/farmer", label: "Home" },
        { to: "/farmer/equipment", label: "Equipment" },
        { to: "/farmer/bookings", label: "Bookings" },
        { to: "/farmer/payments", label: "Payments" },
        { to: "/farmer/messages", label: "Messages" },
        { to: "/profile", label: "Profile" },
      ];
    }
    if (role === "owner") {
      return [
        { to: "/owner", label: "Dashboard" },
        { to: "/owner/listings", label: "My Listings" },
        { to: "/owner/requests", label: "Requests" },
        { to: "/owner/earnings", label: "Earnings" },
        { to: "/owner/messages", label: "Messages" },
        { to: "/profile", label: "Profile" },
      ];
    }
    if (role === "delivery") {
      return [
        { to: "/delivery", label: "Dashboard" },
        { to: "/delivery/pickups", label: "Pickups" },
        { to: "/delivery/deliveries", label: "Deliveries" },
        { to: "/delivery/returns", label: "Returns" },
        { to: "/delivery/history", label: "History" },
        { to: "/profile", label: "Profile" },
      ];
    }
    if (role === "admin") {
      return [
        { to: "/admin", label: "Admin" },
        { to: "/profile", label: "Profile" },
      ];
    }
    return [
      { to: "/", label: "Home" },
      { to: "/login", label: "Login" },
      { to: "/signup", label: "Sign Up" },
    ];
  }, [role]);

  return (
    <header className="site-header">
      <div className="site-brand">
        <div className="site-badge">A</div>
        <div className="site-text">
          <div className="site-title">AGRO RENT</div>
          <div className="site-subtitle">SMART FARM SOLUTIONS</div>
        </div>
      </div>

      <nav className="site-nav">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`site-link ${location.pathname === link.to ? "active" : ""} ${
              link.label === "Messages" && unreadCount > 0 ? "has-badge" : ""
            }`}
          >
            {link.label}
            {link.label === "Messages" && unreadCount > 0 && (
              <span className="site-link-badge">{unreadCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="site-user">
        <div className="site-avatar">{displayName.charAt(0).toUpperCase()}</div>
        <div className="site-username">{displayName}</div>
      </div>
    </header>
  );
};

export default SiteHeader;
