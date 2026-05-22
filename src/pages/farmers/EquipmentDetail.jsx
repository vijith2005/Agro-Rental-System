import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { readStoredUser } from "../../utils/authApi";
import heroImage from "../../assets/hero.jpg";
import farmerImage from "../../assets/farmerbg.jpg";

const imageMap = {
  hero: heroImage,
  farmer: farmerImage,
};

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const equipments = getStored(STORAGE_KEYS.equipments, []);
  const equipment = useMemo(
    () => equipments.find((item) => item.id === id),
    [equipments, id]
  );

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  if (!equipment) {
    return (
      <div className="agr-page">
        <div className="card p-4">
          <h3 className="mb-2">Equipment not found</h3>
          <Link to="/farmer/equipment" className="btn btn-warning">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    const rentals = getStored(STORAGE_KEYS.rentals, []);
    const invoices = getStored(STORAGE_KEYS.invoices, []);
    const currentUser = readStoredUser();

    const bookingId = `rental-${Date.now()}`;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const amount = equipment.day * diffDays;

    rentals.push({
      id: bookingId,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      farmerId: currentUser?.email || "farmer@example.com",
      farmerName: currentUser?.name || "Farmer",
      ownerId: equipment.ownerId || "owner@demo.com",
      ownerName: equipment.ownerName || "Owner",
      startDate,
      endDate,
      status: "REQUESTED",
      totalAmount: amount,
      createdAt: new Date().toISOString(),
    });

    invoices.push({
      id: `inv-${Date.now()}`,
      rentalId: bookingId,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      amount,
      method: paymentMethod,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      farmerId: currentUser?.email || "farmer@example.com",
      farmerName: currentUser?.name || "Farmer",
      ownerId: equipment.ownerId || "owner@demo.com",
      ownerName: equipment.ownerName || "Owner",
      receiptNumber: `rcpt-${bookingId}`,
    });

    setStored(STORAGE_KEYS.rentals, rentals);
    setStored(STORAGE_KEYS.invoices, invoices);
    navigate("/farmer/bookings");
  };

  return (
    <div className="agr-page equipment-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="agr-meta text-uppercase">Equipment</div>
          <h2 className="agr-h1 mb-1">{equipment.name}</h2>
          <div className="text-muted">
            {equipment.category} • {equipment.location}
          </div>
        </div>
        <Link to="/farmer/equipment" className="btn btn-outline-primary">
          Back to Browse
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div
            className="card shadow-sm overflow-hidden detail-hero-img"
            style={{ backgroundImage: `url(${equipment.imageUrl || imageMap[equipment.imageKey] || heroImage})` }}
          />
        </div>
        <div className="col-lg-5">
          <div className="card shadow-sm p-3 detail-side">
            <h5 className="mb-1">{equipment.name}</h5>
            <p className="text-muted small mb-3">{equipment.description}</p>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded price-chip mb-3">
              <span className="fw-bold text-success">₹{equipment.day}/day</span>
              <span className="text-muted">• ₹{equipment.week}/week • ₹{equipment.month}/month</span>
            </div>
            <div className="alert alert-success py-2 small mb-3">
              Message the owner before booking to confirm availability and delivery.
            </div>

            <div className="form-field">
              <label>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label>End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Payment method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-warning" onClick={handleBooking}>
                Book Now
              </button>
              <Link to="/farmer/messages" className="btn btn-view-outline">
                Message Owner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;
