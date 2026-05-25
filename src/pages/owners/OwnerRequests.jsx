import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
<<<<<<< HEAD
import { approveRental, listRentalsByOwner, updateRentalStatus } from "../../api/rentalApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { formatBookingDate } from "../../utils/bookingDates";
import { mergeRentalsById } from "../../utils/rentalCache";

const formatCurrency = (amount) => `Rs ${new Intl.NumberFormat("en-IN").format(Number(amount) || 0)}`;
=======
import { approveRental, listRentalsByOwner } from "../../api/rentalApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
>>>>>>> origin/main

const OwnerRequests = () => {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [rentals, setRentals] = useState(getStored(STORAGE_KEYS.rentals, []));
  const [loadError, setLoadError] = useState("");
<<<<<<< HEAD
  const [cancelModal, setCancelModal] = useState({ open: false, rental: null });
=======
>>>>>>> origin/main

  const currentUser = getCurrentUser();
  const ownerKey = currentUser?.email || "owner@demo.com";

<<<<<<< HEAD
  const persistRentals = (nextOwnerRentals) => {
    const cached = getStored(STORAGE_KEYS.rentals, []);
    const merged = mergeRentalsById(nextOwnerRentals, cached);
    setRentals(nextOwnerRentals);
    setStored(STORAGE_KEYS.rentals, merged);
  };

  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      const cached = getStored(STORAGE_KEYS.rentals, []).filter(
        (item) => (item.ownerId || "").toLowerCase() === ownerKey.toLowerCase()
      );

      try {
        const data = await listRentalsByOwner(ownerKey);
        const content = mergeRentalsById(Array.isArray(data) ? data : [], cached);
        if (!active) return;
        setRentals(content);
        setStored(STORAGE_KEYS.rentals, mergeRentalsById(content, getStored(STORAGE_KEYS.rentals, [])));
        setLoadError("");
      } catch {
        if (active) {
          setRentals(cached);
          setLoadError("Using cached rentals because the backend is unavailable.");
        }
      }
    };

=======
  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      try {
        const data = await listRentalsByOwner(ownerKey);
        const content = Array.isArray(data) ? data : [];
        if (!active) return;
        setRentals(content);
        setStored(STORAGE_KEYS.rentals, content);
        setLoadError("");
      } catch {
        if (active) {
          setLoadError("Using cached rentals because the backend is unavailable.");
        }
      }
    };

>>>>>>> origin/main
    loadRentals();
    const onRentalUpdated = () => loadRentals();
    window.addEventListener(RENTAL_UPDATED_EVENT, onRentalUpdated);
    return () => {
      active = false;
      window.removeEventListener(RENTAL_UPDATED_EVENT, onRentalUpdated);
    };
  }, [ownerKey]);

  const requestList = rentals.filter((rental) => (rental.ownerId || "").toLowerCase() === ownerKey.toLowerCase());

  const approveRequest = async (rentalId) => {
    try {
      const updated = await approveRental(rentalId, { approvalNote: "Approved from owner dashboard" });
      const nextRentals = rentals.map((rental) => (rental.id === rentalId ? updated : rental));
<<<<<<< HEAD
      persistRentals(nextRentals);
=======
      setRentals(nextRentals);
      setStored(STORAGE_KEYS.rentals, nextRentals);
>>>>>>> origin/main
      notifyRentalUpdated();
    } catch {
      const nextRentals = rentals.map((rental) =>
        rental.id === rentalId ? { ...rental, status: "APPROVED" } : rental
      );
<<<<<<< HEAD
      persistRentals(nextRentals);
      notifyRentalUpdated();
    }
  };

  const openCancel = (rental) => setCancelModal({ open: true, rental });
  const closeCancel = () => setCancelModal({ open: false, rental: null });

  const cancelRequest = async () => {
    if (!cancelModal.rental) return;

    try {
      const updated = await updateRentalStatus(cancelModal.rental.id, {
        status: "CANCELLED",
        note: "Cancelled from owner requests",
      });
      const nextRentals = rentals.map((rental) => (rental.id === cancelModal.rental.id ? updated : rental));
      persistRentals(nextRentals);
      notifyRentalUpdated();
    } catch {
      const nextRentals = rentals.map((rental) =>
        rental.id === cancelModal.rental.id ? { ...rental, status: "CANCELLED" } : rental
      );
      persistRentals(nextRentals);
      notifyRentalUpdated();
    }

    closeCancel();
=======
      setRentals(nextRentals);
      setStored(STORAGE_KEYS.rentals, nextRentals);
      notifyRentalUpdated();
    }
>>>>>>> origin/main
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
      {loadError && <div className="alert alert-warning mb-3">{loadError}</div>}
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
              <div key={rental.id} className="list-card owner-request-card">
                <div className="owner-request-copy">
                  <div className="equipment-name">{rental.equipmentName}</div>
<<<<<<< HEAD
                  <div className="list-meta">Requested by {rental.farmerName || rental.farmerId || "Farmer"}</div>
                  <div className="list-meta owner-request-date">
                    {formatBookingDate(rental.startDate) || "-"} to {formatBookingDate(rental.endDate) || "-"} |{" "}
                    {formatCurrency(rental.totalAmount)}
=======
                  <div className="list-meta">
                    {rental.startDate} to {rental.endDate} • Rs {rental.totalAmount}
>>>>>>> origin/main
                  </div>
                </div>
                <div className="owner-request-actions">
                  <span className={`status-pill status-${rental.status.toLowerCase()}`}>
                    {rental.status}
                  </span>
<<<<<<< HEAD
                  <div className="owner-request-buttons">
                    {["REQUESTED", "PENDING"].includes((rental.status || "").toUpperCase()) && (
                      <button className="inline-btn" onClick={() => approveRequest(rental.id)}>
                        Approve
                      </button>
                    )}
                    {["REQUESTED", "PENDING", "APPROVED"].includes((rental.status || "").toUpperCase()) && (
                      <button className="inline-btn" onClick={() => openCancel(rental)}>
                        Cancel
                      </button>
                    )}
                    <Link to={`/owner/messages?rentalId=${encodeURIComponent(rental.id)}`} className="inline-btn">
                      Message
                    </Link>
                  </div>
=======
                  {rental.status === "REQUESTED" ? (
                    <button className="inline-btn" onClick={() => approveRequest(rental.id)}>
                      Approve
                    </button>
                  ) : (
                    <span className="inline-btn">Approved</span>
                  )}
                  <Link to={`/owner/messages?rentalId=${encodeURIComponent(rental.id)}`} className="inline-btn">
                    Message
                  </Link>
>>>>>>> origin/main
                </div>
              </div>
            ))}
          </div>
          <div className="messages-pagination">
            <div className="page-info">
              Page {page} of {totalPages}
            </div>
            <div className="page-actions">
              <button
                className="page-btn"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
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
              <button
                className="page-btn"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Request?</h5>
                <button type="button" className="btn-close" onClick={closeCancel}></button>
              </div>
              <div className="modal-body">
                <p className="mb-2 fw-semibold">{cancelModal.rental?.equipmentName}</p>
                <p className="text-muted small mb-0">
                  {formatBookingDate(cancelModal.rental?.startDate) || "-"} to{" "}
                  {formatBookingDate(cancelModal.rental?.endDate) || "-"}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeCancel}>
                  Keep Request
                </button>
                <button className="btn btn-danger" onClick={cancelRequest}>
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

export default OwnerRequests;
