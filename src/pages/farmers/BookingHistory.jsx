import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { createPayment, createRazorpayOrder } from "../../api/paymentApi";
import { listRentalsByFarmer, updateRentalStatus } from "../../api/rentalApi";
import { getApiErrorMessage } from "../../api/http";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { notifyPaymentUpdated } from "../../utils/paymentEvents";
import { buildRazorpayReceipt, openRazorpayCheckout } from "../../utils/razorpay";
import { formatBookingDate } from "../../utils/bookingDates";
import { mergeRentalsById } from "../../utils/rentalCache";

const TABS = ["All", "Pending", "Confirmed", "Cancelled", "Completed"];

const statusClass = (status) => {
  const key = (status || "").toLowerCase();
  if (key === "paid" || key === "confirmed") return "badge bg-success text-white";
  if (key === "pending") return "badge bg-warning text-dark";
  if (key === "cancelled") return "badge bg-danger";
  if (key === "completed") return "badge bg-secondary";
  return "badge bg-light text-dark";
};

const normalizeUiStatus = (status) => {
  const key = (status || "").toUpperCase();
  if (key === "REQUESTED" || key === "PENDING") return "Pending";
  if (key === "APPROVED" || key === "SCHEDULED" || key === "IN_TRANSIT" || key === "DELIVERED" || key === "IN_USE" || key === "RETURN_SCHEDULED" || key === "PAID") {
    return "Confirmed";
  }
  if (key === "COMPLETED" || key === "RETURNED") return "Completed";
  if (key === "CANCELLED" || key === "REJECTED" || key === "DAMAGED") return "Cancelled";
  return status || "Pending";
};

const BookingHistory = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null });
  const [processingId, setProcessingId] = useState("");
  const pageSize = 6;
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      const currentUser = getCurrentUser();
      const farmerId = currentUser?.email || "farmer@demo.com";
      const cached = getStored(STORAGE_KEYS.rentals, []).filter(
        (rental) => (rental.farmerId || "").toLowerCase() === farmerId.toLowerCase()
      );

      try {
        const data = await listRentalsByFarmer(farmerId);
        if (!active) return;
        const merged = mergeRentalsById(Array.isArray(data) ? data : [], cached);
        const content = merged.map((item) => ({
          ...item,
          status: normalizeUiStatus(item.status),
        }));
        setBookings(content);
        setStored(STORAGE_KEYS.rentals, content);
      } catch {
        if (!active) return;
        const normalized = cached.map((r) => ({
          ...r,
          status: normalizeUiStatus(r.status),
        }));
        setBookings(normalized);
      }
    };

    loadBookings();
    const onRentalUpdated = () => loadBookings();
    window.addEventListener(RENTAL_UPDATED_EVENT, onRentalUpdated);
    return () => {
      active = false;
      window.removeEventListener(RENTAL_UPDATED_EVENT, onRentalUpdated);
    };
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
      if (key === "pending" || key === "requested") base.pending += 1;
      else if (key === "confirmed") base.confirmed += 1;
      else if (key === "cancelled") base.cancelled += 1;
      else if (key === "completed") base.completed += 1;
    });
    return base;
  }, [bookings]);

  const openCancel = (booking) => setCancelModal({ open: true, booking });
  const closeCancel = () => setCancelModal({ open: false, booking: null });

  const confirmCancel = async () => {
    if (!cancelModal.booking) return;
    try {
      const updatedRental = await updateRentalStatus(cancelModal.booking.id, {
        status: "CANCELLED",
        note: "Cancelled from farmer booking history",
      });
      const updated = bookings.map((b) =>
        b.id === cancelModal.booking.id ? { ...updatedRental, status: normalizeUiStatus(updatedRental.status) } : b
      );
      setBookings(updated);
      setStored(STORAGE_KEYS.rentals, updated);
      notifyRentalUpdated();
    } catch {
      const updated = bookings.map((b) => (b.id === cancelModal.booking.id ? { ...b, status: "Cancelled" } : b));
      setBookings(updated);
      setStored(STORAGE_KEYS.rentals, updated);
      notifyRentalUpdated();
    }
    closeCancel();
  };

  const handlePay = async (id) => {
    const currentUser = getCurrentUser();
    const rental = bookings.find((item) => item.id === id);
    if (!rental) return;

    setProcessingId(id);

    try {
      const description = `${rental.equipmentName || "Equipment"} rental payment`;
      try {
        const order = await createRazorpayOrder({
          amount: Math.round(Number(rental.totalAmount || 0)),
          receipt: buildRazorpayReceipt(rental.id || rental.equipmentId || "rental"),
          description,
        });

        const response = await openRazorpayCheckout({
          key: order?.keyId || razorpayKeyId,
          amountInSubunits: order?.amount,
          currency: order?.currency || "INR",
          orderId: order?.id,
          name: "AgroConnect",
          description,
          prefill: {
            name: currentUser?.name || rental.farmerName || "Farmer",
            email: currentUser?.email || "farmer@demo.com",
            contact: currentUser?.phone || "",
          },
          notes: {
            rentalId: rental.id || "",
            equipmentId: rental.equipmentId || "",
            equipmentName: rental.equipmentName || "",
          },
        });

        const paymentPayload = {
          rentalId: rental.id,
          equipmentId: rental.equipmentId,
          equipmentName: rental.equipmentName,
          farmerId: currentUser?.email || "farmer@demo.com",
          farmerName: currentUser?.name || rental.farmerName || "Farmer",
          ownerId: rental.ownerId || "",
          ownerName: rental.ownerName || "",
          amount: Number(rental.totalAmount || 0),
          paymentMethod: "Razorpay",
          gateway: "Razorpay",
          transactionId: response.razorpay_payment_id,
          receiptNumber: order?.receipt || response.razorpay_order_id || `rcpt-${Date.now()}`,
          note: "Paid via Razorpay test mode from booking history",
          status: "PAID",
        };

        try {
          const paymentRecord = await createPayment(paymentPayload);
          const cachedPayments = getStored(STORAGE_KEYS.payments, []);
          setStored(STORAGE_KEYS.payments, [
            paymentRecord,
            ...cachedPayments.filter((payment) => payment.rentalId !== id),
          ]);
        } catch {
          const now = new Date().toISOString();
          const cachedPayments = getStored(STORAGE_KEYS.payments, []);
          setStored(STORAGE_KEYS.payments, [
            {
              id: `pay-${Date.now()}`,
              ...paymentPayload,
              currency: "INR",
              paidAt: now,
              initiatedAt: now,
              createdAt: now,
              updatedAt: now,
            },
            ...cachedPayments.filter((payment) => payment.rentalId !== id),
          ]);
        }
        notifyPaymentUpdated();

        try {
          const updatedRental = await updateRentalStatus(id, { status: "PAID", note: "Paid via Razorpay" });
          const updated = bookings.map((b) =>
            b.id === id ? { ...updatedRental, status: normalizeUiStatus(updatedRental.status) } : b
          );
          setBookings(updated);
          setStored(STORAGE_KEYS.rentals, updated);
          notifyRentalUpdated();
        } catch {
          const updated = bookings.map((b) => (b.id === id ? { ...b, status: "Confirmed" } : b));
          setBookings(updated);
          setStored(STORAGE_KEYS.rentals, updated);
          notifyRentalUpdated();
        }
        toast.success("Payment completed successfully.");
      } catch (checkoutError) {
        if (checkoutError?.code === "RAZORPAY_CANCELLED") {
          toast("Payment was cancelled.");
        } else {
          console.warn("Razorpay checkout failed.", checkoutError);
          toast.error(getApiErrorMessage(checkoutError, "Unable to complete Razorpay checkout."));
        }
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to complete Razorpay checkout."));
    } finally {
      setProcessingId("");
    }
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
                <th >Equipment</th>
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
                      <div className="fw-semibold text-success">{b.equipmentName || "Equipment"}</div>
                      <div className="text-muted small">{b.location || "-"}</div>
                    </td>
                    <td className="text-muted small">{b.ownerName || "Owner"}</td>
                    <td>{formatBookingDate(b.startDate) || "-"}</td>
                    <td>{formatBookingDate(b.endDate) || "-"}</td>
                    <td>{days}</td>
                    <td className="fw-bold">Rs {total}</td>
                    <td>
                      <span className={statusClass(status)}>{status}</span>
                    </td>
                    <td className="text-end d-flex gap-2 justify-content-end flex-wrap">
                      {status.toLowerCase() === "pending" && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => openCancel(b)}>
                          Cancel
                        </button>
                      )}
                      {status.toLowerCase() === "pending" && (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handlePay(b.id)}
                          disabled={processingId === b.id}
                        >
                          {processingId === b.id ? "Opening Razorpay..." : "Pay Now"}
                        </button>
                      )}
                      <Link
                        className="btn btn-outline-primary btn-sm"
                        to={`/farmer/messages?rentalId=${encodeURIComponent(b.id)}`}
                      >
                        Message Owner
                      </Link>
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
                  {formatBookingDate(cancelModal.booking?.startDate) || "-"} to{" "}
                  {formatBookingDate(cancelModal.booking?.endDate) || "-"}
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
