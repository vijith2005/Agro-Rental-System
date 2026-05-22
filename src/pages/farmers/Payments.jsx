import React, { useEffect, useMemo, useState } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { authErrorMessage, readStoredToken, readStoredUser } from "../../utils/authApi";
import { paymentApi, paymentAuthHeaders } from "../../utils/paymentApi";

const methodOptions = ["UPI", "Card", "Net Banking", "Cash", "Razorpay"];

const Payments = () => {
  const [invoices, setInvoices] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [payModal, setPayModal] = useState({ open: false, invoice: null });
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [netBank, setNetBank] = useState("SBI");
  const [loading, setLoading] = useState(false);
  const [rzpLoading, setRzpLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    setInvoices(getStored(STORAGE_KEYS.invoices, []));
    setRentals(getStored(STORAGE_KEYS.rentals, []));
  }, []);

  const pendingPayments = invoices.filter((inv) => (inv.status || "").toLowerCase() !== "paid");
  const history = invoices.filter((inv) => (inv.status || "").toLowerCase() === "paid");

  const summary = useMemo(() => {
    const totalPaid = history.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const totalPending = pendingPayments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    return {
      totalPaid,
      totalPending,
      totalRefunded: 0,
    };
  }, [history, pendingPayments]);

  const openPayModal = (invoice) => {
    setPayModal({ open: true, invoice });
    setPaymentMethod("UPI");
    setPaymentError("");
  };

  const closePayModal = () => {
    setPayModal({ open: false, invoice: null });
    setUpiId("");
    setCardDetails({ number: "", expiry: "", cvv: "" });
    setPaymentError("");
  };

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });

  const markInvoicePaid = (invoiceId, methodLabel) => {
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: "PAID", method: methodLabel, paidAt: new Date().toISOString() } : inv
    );
    setInvoices(updatedInvoices);
    setStored(STORAGE_KEYS.invoices, updatedInvoices);
    const updatedRentals = rentals.map((rent) =>
      rent.id === payModal.invoice?.rentalId ? { ...rent, status: "Confirmed" } : rent
    );
    setRentals(updatedRentals);
    setStored(STORAGE_KEYS.rentals, updatedRentals);
  };

  const handleRazorpay = async () => {
    if (!payModal.invoice) return;
    try {
      const token = readStoredToken();
      const currentUser = readStoredUser();
      if (!token || !currentUser) {
        setPaymentError("Your session expired. Please log in again.");
        return;
      }

      setRzpLoading(true);
      await loadRazorpay();
      const amountRupees = Math.max(1, Math.round(Number(payModal.invoice.amount) || 0));
      const receipt = payModal.invoice.receiptNumber || payModal.invoice.id || `rcpt-${Date.now()}`;
      const equipmentList = getStored(STORAGE_KEYS.equipments, []);
      const rental = rentals.find((item) => item.id === payModal.invoice.rentalId);
      const equipment =
        equipmentList.find((item) => item.id === rental?.equipmentId) ||
        equipmentList.find((item) => item.name === payModal.invoice.equipmentName);
      const orderResponse = await paymentApi.post(
        "/razorpay/orders",
        {
          amount: amountRupees,
          receipt,
          description: payModal.invoice.equipmentName || "Equipment booking",
        },
        {
          headers: paymentAuthHeaders(),
        }
      );

      const order = orderResponse.data;
      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        throw new Error("Missing Razorpay key id. Add VITE_RAZORPAY_KEY_ID to .env.local");
      }

      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: "INR",
        name: "AgroRent",
        description: payModal.invoice.equipmentName || "Equipment booking",
        order_id: order.id,
        handler: async (response) => {
          try {
            await paymentApi.post(
              "",
              {
                rentalId: payModal.invoice.rentalId || "",
                equipmentId: payModal.invoice.equipmentId || equipment?.id || payModal.invoice.rentalId || "",
                equipmentName: payModal.invoice.equipmentName || equipment?.name || "Equipment",
                farmerId: currentUser.email || "farmer@example.com",
                farmerName: currentUser.name || "Farmer",
                ownerId: payModal.invoice.ownerId || equipment?.ownerId || "owner@demo.com",
                ownerName: payModal.invoice.ownerName || equipment?.ownerName || "Owner",
                amount: amountRupees,
                paymentMethod: "Razorpay",
                gateway: "Razorpay",
                transactionId: response.razorpay_payment_id,
                receiptNumber: receipt,
                note: `Razorpay order ${order.id}`,
                status: "PAID",
              },
              {
                headers: paymentAuthHeaders(),
              }
            );
            markInvoicePaid(payModal.invoice.id, "Razorpay");
            closePayModal();
          } catch (saveError) {
            setPaymentError(
              authErrorMessage(saveError, "Payment completed, but saving it on the server failed")
            );
            markInvoicePaid(payModal.invoice.id, "Razorpay");
          } finally {
            setRzpLoading(false);
          }
        },
        prefill: {
          email: currentUser.email || "farmer@example.com",
          name: currentUser.name || "Farmer",
        },
        theme: { color: "#1B4332" },
        modal: {
          ondismiss: () => {
            setRzpLoading(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        const reason =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed";
        setPaymentError(reason);
        setRzpLoading(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentError(authErrorMessage(err, "Unable to start Razorpay checkout"));
      setRzpLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!payModal.invoice) return;
    if (paymentMethod === "Razorpay") {
      return handleRazorpay();
    }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    markInvoicePaid(payModal.invoice.id, paymentMethod);
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
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="agr-page">
      <div className="d-flex flex-column gap-3 mb-4">
        <div className="d-flex flex-wrap justify-content-between gap-3">
          <div>
            <h2 className="agr-h1 mb-1">Payments</h2>
            <p className="text-muted mb-0">Complete pending invoices and review history.</p>
          </div>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Paid</div>
              <div className="fs-4 fw-bold text-primary">₹{summary.totalPaid}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Pending</div>
              <div className="fs-4 fw-bold text-warning">₹{summary.totalPending}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <div className="text-muted small">Total Refunded</div>
              <div className="fs-4 fw-bold text-secondary">₹{summary.totalRefunded}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Pending Payments</h5>
            <span className="badge bg-warning text-dark">{pendingPayments.length} due</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Equipment</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">No pending payments.</td></tr>
              )}
              {pendingPayments.map((inv) => (
                <tr key={inv.id}>
                  <td>#{inv.rentalId || inv.id}</td>
                  <td>{inv.equipmentName || "Equipment"}</td>
                  <td className="fw-bold">₹{inv.amount || 0}</td>
                  <td>{inv.dueDate || "—"}</td>
                  <td><span className="badge bg-warning text-dark">{inv.status || "PENDING"}</span></td>
                  <td className="text-end">
                    <button className="btn btn-warning btn-sm" onClick={() => openPayModal(inv)}>
                      Pay Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {showHistory && (
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Payment History</h5>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Equipment</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Transaction</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No payments made yet.</td></tr>
                )}
                {history.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.paidAt || "—"}</td>
                    <td>{inv.equipmentName || "Equipment"}</td>
                    <td className="fw-bold">₹{inv.amount || 0}</td>
                    <td>{inv.method || "UPI"}</td>
                    <td>{inv.transactionId || "N/A"}</td>
                    <td><span className="badge bg-success">Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Now Modal */}
      {payModal.open && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complete Payment</h5>
                <button className="btn-close" onClick={closePayModal}></button>
              </div>
              <div className="modal-body">
                {paymentError ? <div className="alert alert-danger py-2">{paymentError}</div> : null}
                <div className="mb-3">
                  <div className="fw-semibold">{payModal.invoice?.equipmentName || "Equipment"}</div>
                  <div className="text-muted small">
                    Amount: <span className="fw-bold text-primary">₹{payModal.invoice?.amount || 0}</span>
                  </div>
                </div>
            <div className="mb-3">
              <label className="form-label">Payment Method</label>
              <div className="btn-group w-100">
                {methodOptions.map((m) => (
                  <button
                    key={m}
                        className={`btn btn-sm ${paymentMethod === m ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMethod !== "Razorpay" && renderMethodFields()}
                {paymentMethod === "Cash" && (
                  <p className="text-muted small mb-0">Pay at the time of pickup; status will update automatically.</p>
                )}
                {paymentMethod === "Razorpay" && (
                  <p className="text-muted small mb-0">Secure checkout via Razorpay. Amount: ₹{payModal.invoice?.amount || 0}</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closePayModal} disabled={loading}>
                  Close
                </button>
                <button className="btn btn-warning" onClick={confirmPayment} disabled={loading}>
                  {(loading || rzpLoading)
                    ? "Processing..."
                    : paymentMethod === "Razorpay"
                      ? `Pay with Razorpay ₹${payModal.invoice?.amount || 0}`
                      : `Confirm Payment ₹${payModal.invoice?.amount || 0}`}
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
