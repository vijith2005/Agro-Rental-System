import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getEquipmentById } from "../../api/equipmentApi";
import { createRental } from "../../api/rentalApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { notifyRentalUpdated } from "../../utils/rentalEvents";
import heroImage from "../../assets/hero.jpg";
import farmerImage from "../../assets/farmerbg.jpg";

const imageMap = {
  hero: heroImage,
  farmer: farmerImage,
};

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [paymentMethod] = useState("Razorpay");

  useEffect(() => {
    let active = true;

    const loadEquipment = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await getEquipmentById(id);
        if (!active) return;
        setEquipment(data);
      } catch {
        if (!active) return;
        const fallback = getStored(STORAGE_KEYS.equipments, []).find((item) => item.id === id);
        setEquipment(fallback || null);
        setLoadError(fallback ? "Showing cached equipment details." : "Equipment not found.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadEquipment();
    return () => {
      active = false;
    };
  }, [id]);

  const handleBooking = () => {
    if (!equipment) return;

    const currentUser = getCurrentUser();

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const amount = Number(equipment.day || 0) * diffDays;

    const payload = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      ownerId: equipment.ownerId || "",
      ownerName: equipment.ownerName || "",
      farmerName: currentUser?.name || "Farmer",
      pickupLocation: equipment.location || "",
      deliveryLocation: equipment.location || "",
      startDate,
      endDate,
      dailyRate: Number(equipment.day || 0),
      totalAmount: amount,
      paymentMethod,
      notes: `Booked from frontend by ${currentUser?.email || "farmer"}`,
    };

    createRental(payload)
      .then(() => {
        notifyRentalUpdated();
        navigate("/farmer/bookings");
      })
      .catch(() => {
        const rentals = getStored(STORAGE_KEYS.rentals, []);
        const bookingId = `rental-${Date.now()}`;

        rentals.push({
          id: bookingId,
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          farmerName: currentUser?.name || "Farmer",
          startDate,
          endDate,
          status: "REQUESTED",
          totalAmount: amount,
          createdAt: new Date().toISOString(),
        });

        setStored(STORAGE_KEYS.rentals, rentals);
        notifyRentalUpdated();
        navigate("/farmer/bookings");
      });
  };

  if (isLoading) {
    return (
      <div className="agr-page">
        <div className="card p-4">
          <h3 className="mb-2">Loading equipment...</h3>
          <p className="text-muted mb-0">Fetching the latest listing from the backend.</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="agr-page">
        <div className="card p-4">
          <h3 className="mb-2">Equipment not found</h3>
          {loadError && <p className="text-muted">{loadError}</p>}
          <Link to="/farmer/equipment" className="btn btn-warning">
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="agr-page equipment-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="agr-meta text-uppercase">Equipment</div>
          <h2 className="agr-h1 mb-1">{equipment.name}</h2>
          <div className="text-muted">
            {equipment.category} • {equipment.location}
          </div>
          {loadError && <div className="text-muted small mt-1">{loadError}</div>}
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
              <span className="fw-bold text-success">Rs {equipment.day}/day</span>
              <span className="text-muted">
                • Rs {equipment.week}/week • Rs {equipment.month}/month
              </span>
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
            <div className="alert alert-info py-2 small mb-3">
              Payments now use Razorpay test mode for a cleaner checkout flow.
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
