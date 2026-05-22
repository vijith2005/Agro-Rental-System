import React, { useEffect, useMemo, useState } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { createPayment, createRazorpayOrder, listPaymentsByFarmer } from "../../api/paymentApi";
import { listRentalsByFarmer, updateRentalStatus } from "../../api/rentalApi";
import { getApiErrorMessage } from "../../api/http";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { PAYMENT_UPDATED_EVENT, notifyPaymentUpdated } from "../../utils/paymentEvents";
import { openRazorpayCheckout } from "../../utils/razorpay";

const Payments = () => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [payModal, setPayModal] = useState({ open: false, rental: null });
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const farmerKey = getCurrentUser()?.email || "farmer@demo.com";
  const farmerName = getCurrentUser()?.name || "Farmer";
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const appendWarning = (warning) => {
    setWarnings((current) => (current.includes(warning) ? current : [...current, warning]));
  };

  useEffect(() => {
    let active = true;
    setWarnings([]);

    const loadRentals = async () => {
      try {
        const data = await listRentalsByFarmer(farmerKey);
        if (!active) return;
        const content = Array.isArray(data) ? data : [];
        setRentals(content);
        setStored(STORAGE_KEYS.rentals, content);
      } catch {
        if (!active) return;
        setRentals(getStored(STORAGE_KEYS.rentals, []));
        appendWarning("Using cached rentals because the backend is unavailable.");
      }
    };

    const loadPayments = async () => {
      try {
        const data = await listPaymentsByFarmer(farmerKey);
        if (!active) return;
        const content = Array.isArray(data) ? data : [];
        setPayments(content);
        setStored(STORAGE_KEYS.payments, content);
      } catch {
        if (!active) return;
        const cached = getStored(STORAGE_KEYS.payments, []).filter(
          (payment) => !payment.farmerId || payment.farmerId === farmerKey
        );
        setPayments(cached);
        if (cached.length === 0) {
          appendWarning("Using cached payments because the backend is unavailable.");
        }
      }
    };

    loadRentals();
    loadPayments();

    const onUpdated = () => {
      loadRentals();
      loadPayments();
    };

    window.addEventListener(RENTAL_UPDATED_EVENT, onUpdated);
    window.addEventListener(PAYMENT_UPDATED_EVENT, onUpdated);
    return () => {
      active = false;
      window.removeEventListener(RENTAL_UPDATED_EVENT, onUpdated);
      window.removeEventListener(PAYMENT_UPDATED_EVENT, onUpdated);
    };
  }, [farmerKey]);

  const activeRentals = rentals.filter(
    (inv) => !["CANCELLED", "COMPLETED", "REFUNDED"].includes((inv.status || "").toUpperCase())
  );
  const history = payments.filter((payment) => (payment.status || "").toUpperCase() === "PAID");
  const activeWithPaymentState = useMemo(
    () =>
      activeRentals.map((rental) => {
        const paidPayment = history.find(
          (payment) => (payment.rentalId || "").toLowerCase() === (rental.id || "").toLowerCase()
        );
        return {
          ...rental,
          hasPaidPayment: Boolean(paidPayment),
          paidPayment,
        };
      }),
    [activeRentals, history]
  );
  const pendingPayments = activeWithPaymentState;

  const summary = useMemo(() => {
    const totalPaid = history.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const totalPending = pendingPayments
      .filter((inv) => !inv.hasPaidPayment)
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalRefunded = payments
      .filter((payment) => (payment.status || "").toUpperCase() === "REFUNDED")
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    return {
      totalPaid,
      totalPending,
      totalRefunded,
    };
  }, [history, pendingPayments, payments]);

  const openPayModal = (rental) => {
    setPayModal({ open: true, rental });
  };

  const closePayModal = () => {
    setPayModal({ open: false, rental: null });
  };

  const buildPaymentPayload = (rental, methodLabel, gatewayMeta = {}) => ({
    rentalId: rental.id,
    equipmentId: rental.equipmentId,
    equipmentName: rental.equipmentName,
    farmerId: farmerKey,
    farmerName,
    ownerId: rental.ownerId || "",
    ownerName: rental.ownerName || "",
    amount: Number(rental.totalAmount || 0),
    paymentMethod: methodLabel,
    gateway: gatewayMeta.gateway || (methodLabel === "Razorpay" ? "Razorpay" : "Manual"),
    transactionId: gatewayMeta.transactionId || `txn-${Date.now()}`,
    receiptNumber: gatewayMeta.receiptNumber || `rcpt-${Date.now()}`,
    note: gatewayMeta.note || `Paid via ${methodLabel}`,
    status: "PAID",
  });

  const createLocalPayment = (rental, methodLabel, gatewayMeta = {}) => {
    const now = new Date().toISOString();
    return {
      id: `pay-${Date.now()}`,
      rentalId: rental.id,
      equipmentId: rental.equipmentId,
      equipmentName: rental.equipmentName,
      farmerId: farmerKey,
      farmerName,
      ownerId: rental.ownerId || "",
      ownerName: rental.ownerName || "",
      amount: Number(rental.totalAmount || 0),
      currency: "INR",
      paymentMethod: methodLabel,
      gateway: gatewayMeta.gateway || (methodLabel === "Razorpay" ? "Razorpay" : "Manual"),
      transactionId: gatewayMeta.transactionId || `txn-${Date.now()}`,
      receiptNumber: gatewayMeta.receiptNumber || `rcpt-${Date.now()}`,
      note: gatewayMeta.note || `Paid via ${methodLabel}`,
      status: "PAID",
      initiatedAt: now,
      paidAt: now,
      updatedAt: now,
      createdAt: now,
    };
  };

  const markAsPaid = async (rental, methodLabel, gatewayMeta = {}) => {
    const payload = buildPaymentPayload(rental, methodLabel, gatewayMeta);
    let paymentRecord;
    try {
      paymentRecord = await createPayment(payload);
    } catch {
      paymentRecord = createLocalPayment(rental, methodLabel, gatewayMeta);
    }

    try {
      const updatedRental = await updateRentalStatus(rental.id, {
        status: "PAID",
        note: `Paid via ${methodLabel}`,
      });
      const updatedRentals = rentals.map((rent) => (rent.id === rental.id ? updatedRental : rent));
      setRentals(updatedRentals);
      setStored(STORAGE_KEYS.rentals, updatedRentals);
      notifyRentalUpdated();
    } catch {
      const updatedRentals = rentals.map((rent) => (rent.id === rental.id ? { ...rent, status: "PAID" } : rent));
      setRentals(updatedRentals);
      setStored(STORAGE_KEYS.rentals, updatedRentals);
      notifyRentalUpdated();
    }

    const updatedPayments = [paymentRecord, ...payments.filter((payment) => payment.rentalId !== rental.id)];
    setPayments(updatedPayments);
    setStored(STORAGE_KEYS.payments, updatedPayments);
    notifyPaymentUpdated();
  };

  const confirmPayment = async () => {
    if (!payModal.rental) return;
    setLoading(true);
    const rental = payModal.rental;
    const currentUser = getCurrentUser();

    try {
      const description = `${rental.equipmentName || "Equipment"} rental payment`;
      let order = null;

      try {
        order = await createRazorpayOrder({
          amount: Number(rental.totalAmount || 0),
          receipt: `rcpt-${rental.id}-${Date.now()}`,
          description,
        });
      } catch (orderError) {
        console.warn("Razorpay order creation failed. Falling back to direct checkout.", orderError);
      }

      const response = await openRazorpayCheckout({
        key: razorpayKeyId,
        amount: Number(rental.totalAmount || 0),
        orderId: order?.id,
        name: "AgroConnect",
        description,
        prefill: {
          name: currentUser?.name || farmerName,
          email: currentUser?.email || farmerKey,
          contact: currentUser?.phone || "",
        },
        notes: {
          rentalId: rental.id || "",
          equipmentId: rental.equipmentId || "",
          equipmentName: rental.equipmentName || "",
        },
      });

      await markAsPaid(rental, "Razorpay", {
        gateway: "Razorpay",
        transactionId: response.razorpay_payment_id,
        receiptNumber: response.razorpay_order_id || order?.id || `rcpt-${Date.now()}`,
        note: "Paid via Razorpay test mode",
      });
      closePayModal();
    } catch (error) {
      appendWarning(getApiErrorMessage(error, "Unable to complete the Razorpay checkout."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agr-page">
      {warnings.map((warning) => (
        <div className="alert alert-warning mb-3" key={warning}>
          {warning}
        </div>
      ))}
      <div className="d-flex flex-column gap-3 mb-4">
        <div className="d-flex flex-wrap justify-content-between gap-3">
          <div>
            <h2 className="agr-h1 mb-1">Payments</h2>
            <p className="text-muted mb-0">Complete pending rental payments and review history.</p>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Paid</div>
              <div className="fs-4 fw-bold text-primary">Rs {summary.totalPaid}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Pending</div>
              <div className="fs-4 fw-bold text-warning">Rs {summary.totalPending}</div>
            </div>
          </div>
          {/* <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Refunded</div>
              <div className="fs-4 fw-bold text-secondary">Rs {summary.totalRefunded}</div>
            </div>
          </div> */}
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Pending Payments</h5>
            <span className="badge bg-warning text-dark">
              {pendingPayments.filter((inv) => !inv.hasPaidPayment).length} due
            </span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>No.</th>
                <th>Equipment</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No pending payments.
                  </td>
                </tr>
              )}
              {pendingPayments.map((inv) => (
                <tr key={inv.id}>
                  <td>{pendingPayments.findIndex((item) => item.id === inv.id) + 1}</td>
                  <td>{inv.equipmentName || "Equipment"}</td>
                  <td className="fw-bold">Rs {inv.totalAmount || 0}</td>
                  <td>
                    {inv.hasPaidPayment ? (
                      <span className="badge bg-success">PAID</span>
                    ) : (
                      <span className="badge bg-warning text-dark">{inv.status || "REQUESTED"}</span>
                    )}
                  </td>
                  <td className="text-end">
                    {inv.hasPaidPayment ? (
                      <span className="badge bg-success">Paid</span>
                    ) : (
                      <button className="btn btn-warning btn-sm" onClick={() => openPayModal(inv)}>
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showHistory && (
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Payment History</h5>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ minWidth: 1040 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>No.</th>
                  <th>Equipment</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No payments made yet.
                    </td>
                  </tr>
                )}
                {history.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.paidAt || "N/A"}</td>
                    <td>{history.findIndex((item) => item.id === inv.id) + 1}</td>
                    <td>{inv.equipmentName || "Equipment"}</td>
                    <td className="fw-bold">Rs {inv.amount || 0}</td>
                    <td>{inv.paymentMethod || "UPI"}</td>
                    <td>
                      <span className="badge bg-success">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payModal.open && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Razorpay Test Checkout</h5>
                <button className="btn-close" onClick={closePayModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="fw-semibold">{payModal.rental?.equipmentName || "Equipment"}</div>
                  <div className="text-muted small">
                    Amount: <span className="fw-bold text-primary">Rs {payModal.rental?.totalAmount || 0}</span>
                  </div>
                </div>
                <p className="text-muted small mb-0">
                  This opens Razorpay test mode and records the payment after the checkout succeeds.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closePayModal} disabled={loading}>
                  Close
                </button>
                <button className="btn btn-warning" onClick={confirmPayment} disabled={loading}>
                  {loading ? "Opening Razorpay..." : `Pay with Razorpay Rs ${payModal.rental?.totalAmount || 0}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
