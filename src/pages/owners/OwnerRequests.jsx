import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { readStoredUser } from "../../utils/authApi";

const OwnerRequests = () => {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [rentals, setRentals] = useState(getStored(STORAGE_KEYS.rentals, []));
  const [invoices, setInvoices] = useState(getStored(STORAGE_KEYS.invoices, []));
  const equipments = getStored(STORAGE_KEYS.equipments, []);

  const currentUser = readStoredUser();
  const ownerKey = currentUser?.email || "owner@demo.com";

  const requestList = rentals.filter((rental) => {
    const equipment = equipments.find((item) => item.id === rental.equipmentId);
    if (!equipment || !equipment.ownerId) return true;
    return equipment.ownerId === ownerKey;
  });

  const approveRequest = (rentalId) => {
    const nextRentals = rentals.map((rental) =>
      rental.id === rentalId ? { ...rental, status: "APPROVED" } : rental
    );
    setRentals(nextRentals);
    setStored(STORAGE_KEYS.rentals, nextRentals);

    const nextInvoices = invoices.map((invoice) =>
      invoice.rentalId === rentalId ? { ...invoice, status: "PENDING" } : invoice
    );
    setInvoices(nextInvoices);
    setStored(STORAGE_KEYS.invoices, nextInvoices);
  };

  const totalPages = Math.max(1, Math.ceil(requestList.length / pageSize));
  const pageItems = requestList.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visiblePages = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="agr-page owner-dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Booking Requests</div>
          <div className="page-subtitle">Approve rental requests from farmers</div>
        </div>
        <Link to="/owner" className="gradient-pill">
          Back to Dashboard
        </Link>
      </div>

      {requestList.length === 0 ? (
        <div className="detail-card">No booking requests yet.</div>
      ) : (
        <div className="list-shell">
          <div className="list-grid">
            {pageItems.map((rental) => (
              <div key={rental.id} className="list-card">
                <div>
                  <div className="equipment-name">{rental.equipmentName}</div>
                  <div className="list-meta">
                    {rental.startDate} to {rental.endDate} • ₹{rental.totalAmount}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`status-pill status-${rental.status.toLowerCase()}`}>
                    {rental.status}
                  </span>
                  {rental.status === "REQUESTED" ? (
                    <button className="inline-btn" onClick={() => approveRequest(rental.id)}>
                      Approve
                    </button>
                  ) : (
                    <span className="inline-btn">Approved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="messages-pagination">
            <div className="page-info">Page {page} of {totalPages}</div>
            <div className="page-actions">
              <button className="page-btn" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                Prev
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`page-btn ${page === pageNumber ? "active" : ""}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button className="page-btn" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerRequests;
