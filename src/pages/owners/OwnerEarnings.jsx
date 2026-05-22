import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, STORAGE_KEYS } from "../../utils/storage";
import { readStoredUser } from "../../utils/authApi";

const OwnerEarnings = () => {
  const invoices = getStored(STORAGE_KEYS.invoices, []);
  const rentals = getStored(STORAGE_KEYS.rentals, []);
  const equipments = getStored(STORAGE_KEYS.equipments, []);

  const currentUser = readStoredUser();
  const ownerKey = currentUser?.email || "owner@demo.com";

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");

  const earningsRows = paidInvoices
    .map((invoice) => {
      const rental = rentals.find((item) => item.id === invoice.rentalId);
      const equipment = equipments.find((item) => item.id === rental?.equipmentId);
      if (equipment?.ownerId && equipment.ownerId !== ownerKey) return null;
      return { invoice, rental, equipment };
    })
    .filter(Boolean);

  const total = earningsRows.reduce((sum, row) => sum + row.invoice.amount, 0);
  const totalPages = Math.max(1, Math.ceil(earningsRows.length / pageSize));
  const pageItems = earningsRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const ownerEquipmentIds = useMemo(
    () => equipments.filter((eq) => !eq.ownerId || eq.ownerId === ownerKey).map((eq) => eq.id),
    [equipments, ownerKey]
  );

  const bookingsByMonth = useMemo(() => {
    const buckets = Array(12).fill(0);
    rentals.forEach((rental) => {
      if (!ownerEquipmentIds.includes(rental.equipmentId)) return;
      const date = new Date(rental.createdAt || rental.startDate);
      if (Number.isNaN(date.getTime())) return;
      buckets[date.getMonth()] += 1;
    });
    return buckets;
  }, [rentals, ownerEquipmentIds]);

  const earningsByMonth = useMemo(() => {
    const buckets = Array(12).fill(0);
    earningsRows.forEach((row) => {
      const date = new Date(row.invoice.createdAt || row.rental?.startDate);
      if (Number.isNaN(date.getTime())) return;
      buckets[date.getMonth()] += row.invoice.amount;
    });
    return buckets;
  }, [earningsRows]);

  const maxBarValue = Math.max(...earningsByMonth, ...bookingsByMonth, 1);

  const visiblePages = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="agr-page owner-dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Earnings</div>
          <div className="page-subtitle">Track your completed payments</div>
        </div>
        <Link to="/owner" className="gradient-pill">
          Back to Dashboard
        </Link>
      </div>

      <div className="detail-card" style={{ marginBottom: 20 }}>
        <div className="equipment-name">Total Earnings</div>
        <div className="page-title">₹{total}</div>
      </div>

      <div className="detail-card" style={{ marginBottom: 24 }}>
        <div className="page-title" style={{ fontSize: 18, marginBottom: 12 }}>Monthly performance</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 14, height: 14, background: "#28a745", borderRadius: 4, display: "inline-block" }}></span>
            Earnings
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 14, height: 14, background: "#0d6efd", borderRadius: 4, display: "inline-block" }}></span>
            Bookings
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gap: 8,
            alignItems: "end",
            height: 220,
            border: "1px solid #eef1f4",
            borderRadius: 10,
            padding: "12px 10px",
            background: "#f9fbfd",
          }}
        >
          {monthLabels.map((label, idx) => {
            const earningVal = earningsByMonth[idx];
            const bookingVal = bookingsByMonth[idx];
            const earnHeight = (earningVal / maxBarValue) * 140;
            const bookHeight = (bookingVal / maxBarValue) * 140;
            return (
              <div key={label} style={{ display: "grid", gap: 6, gridTemplateRows: "1fr auto" }}>
                <div style={{ display: "grid", gap: 6, alignItems: "end" }}>
                  <div style={{ height: earnHeight || 4, background: "#28a745", borderRadius: 6 }} title={`₹${earningVal}`} />
                  <div style={{ height: bookHeight || 4, background: "#0d6efd", borderRadius: 6 }} title={`${bookingVal} bookings`} />
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "#6c757d" }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {earningsRows.length === 0 ? (
        <div className="detail-card">No paid invoices yet.</div>
      ) : (
        <div className="list-shell">
          <div className="list-grid">
            {pageItems.map((row) => (
              <div key={row.invoice.id} className="list-card">
                <div>
                  <div className="equipment-name">{row.equipment?.name || "Equipment"}</div>
                  <div className="list-meta">Invoice {row.invoice.id} • ₹{row.invoice.amount}</div>
                </div>
                <span className="status-pill status-paid">PAID</span>
              </div>
            ))}
          </div>
          <div className="messages-pagination">
            <div className="page-info">Page {page} of {totalPages}</div>
            <div className="page-actions">
              <button className="page-btn" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>Prev</button>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`page-btn ${page === pageNumber ? "active" : ""}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button className="page-btn" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerEarnings;
