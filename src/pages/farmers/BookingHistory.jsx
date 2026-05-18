import React, { useEffect, useMemo, useState } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";

const TABS = ["All", "Pending", "Confirmed", "Cancelled", "Completed"];

const statusClass = (status) => {
  const key = (status || "").toLowerCase();
  if (key === "confirmed") return "badge bg-success text-white";
  if (key === "pending") return "badge bg-warning text-dark";
  if (key === "cancelled") return "badge bg-danger";
  if (key === "completed") return "badge bg-secondary";
  return "badge bg-light text-dark";
};

const BookingHistory = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null });
  const pageSize = 6;

  useEffect(() => {
    const rentals = getStored(STORAGE_KEYS.rentals, []);
    const normalized = rentals.map((r) => ({
      ...r,
      status: r.status || "Pending",
    }));
    setBookings(normalized);
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "All") return bookings;
    return bookings.filter((b) => (b.status || "").toLowerCase() === activeTab.toLowerCase());
  }, [bookings, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const base = { total: bookings.length, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    bookings.forEach((b) => {
      const key = (b.status || "").toLowerCase();
      if (key === "pending") base.pending += 1;
      else if (key === "confirmed") base.confirmed += 1;
      else if (key === "cancelled") base.cancelled += 1;
      else if (key === "completed") base.completed += 1;
    });
    return base;
  }, [bookings]);

  const openCancel = (booking) => setCancelModal({ open: true, booking });
  const closeCancel = () => setCancelModal({ open: false, booking: null });

  const confirmCancel = () => {
    if (!cancelModal.booking) return;
    const updated = bookings.map((b) =>
      b.id === cancelModal.booking.id ? { ...b, status: "Cancelled" } : b
    );
    setBookings(updated);
    setStored(STORAGE_KEYS.rentals, updated);
    closeCancel();
  };

  const handlePay = (id) => {
 
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "Confirmed" } : b
    );
    setBookings(updated);
    setStored(STORAGE_KEYS.rentals, updated);
  };

  const handleComplete = (id) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "Completed" } : b
    );
    setBookings(updated);
    setStored(STORAGE_KEYS.rentals, updated);
  };

  return (
    <div className="agr-page">
      
      <div className="d-flex flex-column gap-3 mb-4">
        <div>
          <h2 className="agr-h1 mb-1">My Bookings</h2>
          <p className="text-muted mb-0">Keep track of your rental requests and payments.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <span className="badge bg-light text-dark">Total: {stats.total}</span>
          <span className="badge bg-warning text-dark">Pending: {stats.pending}</span>
          <span className="badge bg-success">Confirmed: {stats.confirmed}</span>
          <span className="badge bg-secondary">Completed: {stats.completed}</span>
          <span className="badge bg-danger">Cancelled: {stats.cancelled}</span>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Owner</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No bookings in this filter.
                  </td>
                </tr>
              )}

              {pageItems.map((b) => {
                const days = b.days || 1;
                const total = b.totalAmount || b.total || b.day || 0;
                const status = b.status || "Pending";
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="fw-semibold text-primary">{b.equipmentName || "Equipment"}</div>
                      <div className="text-muted small">{b.location || "—"}</div>
                    </td>
                    <td className="text-muted small">{b.ownerName || "Owner"}</td>
                    <td>{b.startDate || "—"}</td>
                    <td>{b.endDate || "—"}</td>
                    <td>{days}</td>
                    <td className="fw-bold">₹{total}</td>
                    <td>
                      <span className={statusClass(status)}>{status}</span>
                    </td>
                    <td className="text-end d-flex gap-2 justify-content-end flex-wrap">
                      {status.toLowerCase() === "pending" && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => openCancel(b)}>
                          Cancel
                        </button>
                      )}
                      {status.toLowerCase() === "confirmed" && (
                        <button className="btn btn-warning btn-sm" onClick={() => handleComplete(b.id)}>
                          Mark Complete
                        </button>
                      )}
                      {status.toLowerCase() === "pending" && (
                        <button className="btn btn-warning btn-sm" onClick={() => handlePay(b.id)}>
                          Pay Now
                        </button>
                      )}
                      {status.toLowerCase() === "completed" && (
                        <button className="btn btn-outline-primary btn-sm">Review</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={`btn btn-sm ${page === idx + 1 ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {cancelModal.open && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Booking?</h5>
                <button type="button" className="btn-close" onClick={closeCancel}></button>
              </div>
              <div className="modal-body">
                <p className="mb-2 fw-semibold">{cancelModal.booking?.equipmentName}</p>
                <p className="text-muted small mb-0">
                  {cancelModal.booking?.startDate} to {cancelModal.booking?.endDate}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeCancel}>
                  Keep Booking
                </button>
                <button className="btn btn-danger" onClick={confirmCancel}>
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
