import React, { useEffect, useMemo, useState } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { createPayment, listPaymentsByFarmer } from "../../api/paymentApi";
import { listRentalsByFarmer, updateRentalStatus } from "../../api/rentalApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { RENTAL_UPDATED_EVENT, notifyRentalUpdated } from "../../utils/rentalEvents";
import { PAYMENT_UPDATED_EVENT, notifyPaymentUpdated } from "../../utils/paymentEvents";

const methodOptions = ["UPI", "Card", "Net Banking", "Cash", "Razorpay"];

const Payments = () => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [payModal, setPayModal] = useState({ open: false, rental: null });
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [netBank, setNetBank] = useState("SBI");
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const farmerKey = getCurrentUser()?.email || "farmer@demo.com";
  const farmerName = getCurrentUser()?.name || "Farmer";

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
    setPaymentMethod("UPI");
  };

  const closePayModal = () => {
    setPayModal({ open: false, rental: null });
    setUpiId("");
    setCardDetails({ number: "", expiry: "", cvv: "" });
  };

  const buildPaymentPayload = (rental, methodLabel) => ({
    rentalId: rental.id,
    equipmentId: rental.equipmentId,
    equipmentName: rental.equipmentName,
    farmerId: farmerKey,
    farmerName,
    ownerId: rental.ownerId || "",
    ownerName: rental.ownerName || "",
    amount: Number(rental.totalAmount || 0),
    paymentMethod: methodLabel,
    gateway: methodLabel === "Razorpay" ? "Razorpay" : "Manual",
    note: `Paid via ${methodLabel}`,
    status: "PAID",
  });

  const createLocalPayment = (rental, methodLabel) => {
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
      gateway: methodLabel === "Razorpay" ? "Razorpay" : "Manual",
      transactionId: `txn-${Date.now()}`,
      receiptNumber: `rcpt-${Date.now()}`,
      note: `Paid via ${methodLabel}`,
      status: "PAID",
      initiatedAt: now,
      paidAt: now,
      updatedAt: now,
      createdAt: now,
    };
  };

  const markAsPaid = async (rental, methodLabel) => {
    let paymentRecord;
    try {
      paymentRecord = await createPayment(buildPaymentPayload(rental, methodLabel));
    } catch {
      paymentRecord = createLocalPayment(rental, methodLabel);
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
    await new Promise((res) => setTimeout(res, 300));
    await markAsPaid(payModal.rental, paymentMethod);
    setLoading(false);
    closePayModal();
  };

  const renderMethodFields = () => {
    if (paymentMethod === "UPI") {
      return (
        <div className="mb-3">
          <label className="form-label">UPI ID</label>
          <input
            className="form-control"
            placeholder="name@bank"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />
        </div>
      );
    }
    if (paymentMethod === "Card") {
      return (
        <>
          <div className="mb-3">
            <label className="form-label">Card Number</label>
            <input
              className="form-control"
              placeholder="xxxx xxxx xxxx xxxx"
              value={cardDetails.number}
              onChange={(e) => setCardDetails((prev) => ({ ...prev, number: e.target.value }))}
            />
          </div>
          <div className="row g-2">
            <div className="col">
              <label className="form-label">Expiry</label>
              <input
                className="form-control"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))}
              />
            </div>
            <div className="col">
              <label className="form-label">CVV</label>
              <input
                className="form-control"
                type="password"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value }))}
              />
            </div>
          </div>
        </>
      );
    }
    if (paymentMethod === "Net Banking") {
      return (
        <div className="mb-3">
          <label className="form-label">Select Bank</label>
          <select className="form-select" value={netBank} onChange={(e) => setNetBank(e.target.value)}>
            {["SBI", "HDFC", "ICICI", "Axis", "Kotak"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return null;
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
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Refunded</div>
              <div className="fs-4 fw-bold text-secondary">Rs {summary.totalRefunded}</div>
            </div>
          </div>
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
                <h5 className="modal-title">Complete Payment</h5>
                <button className="btn-close" onClick={closePayModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="fw-semibold">{payModal.rental?.equipmentName || "Equipment"}</div>
                  <div className="text-muted small">
                    Amount: <span className="fw-bold text-primary">Rs {payModal.rental?.totalAmount || 0}</span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Method</label>
                  <div className="btn-group w-100">
                    {methodOptions.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`btn btn-sm ${paymentMethod === m ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {renderMethodFields()}
                {paymentMethod === "Cash" && (
                  <p className="text-muted small mb-0">Pay at the time of pickup; status will update after confirmation.</p>
                )}
                {paymentMethod === "Razorpay" && (
                  <p className="text-muted small mb-0">
                    Secure checkout via Razorpay is simulated through the payment service record.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closePayModal} disabled={loading}>
                  Close
                </button>
                <button className="btn btn-warning" onClick={confirmPayment} disabled={loading}>
                  {loading ? "Processing..." : `Confirm Payment Rs ${payModal.rental?.totalAmount || 0}`}
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
