import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getEquipmentById } from "../../api/equipmentApi";
import { getApiErrorMessage } from "../../api/http";
import { getMyProfile } from "../../api/profileApi";
import { createRental } from "../../api/rentalApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { notifyRentalUpdated } from "../../utils/rentalEvents";
import { formatAddressLine } from "../../utils/rentalLocations";
import { mergeRentalsById } from "../../utils/rentalCache";
import {
  formatBookingDate,
  getBookingDurationDays,
  parseBookingDate,
} from "../../utils/bookingDates";
import heroImage from "../../assets/hero.jpg";
import farmerImage from "../../assets/farmerbg.jpg";

const imageMap = {
  hero: heroImage,
  farmer: farmerImage,
};

const isEquipmentAvailable = (item) => {
  if (!item) return false;
  const status = (item.status || "").toString().trim().toUpperCase();
  if (status) {
    return status === "AVAILABLE";
  }
  return item.available !== false;
};

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [farmerProfile, setFarmerProfile] = useState(null);
  const today = formatBookingDate(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [paymentMethod] = useState("Razorpay");
  const currentUser = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        if (!active) return;
        setFarmerProfile(profile);
      } catch {
        if (active) {
          setFarmerProfile(currentUser);
        }
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const farmerDropLocation = useMemo(() => {
    return (
      formatAddressLine(farmerProfile) ||
      formatAddressLine(currentUser) ||
      currentUser?.address?.trim() ||
      ""
    );
  }, [currentUser, farmerProfile]);

  const ownerPickupLocation = equipment?.location?.trim() || "";

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

  const handleBooking = async () => {
    if (!equipment) return;

    if (!isEquipmentAvailable(equipment)) {
      toast.error("This equipment is currently unavailable for booking.");
      return;
    }

    if (!ownerPickupLocation) {
      toast.error("Owner pickup location is missing for this listing.");
      return;
    }

    if (!farmerDropLocation) {
      toast.error("Please add your address in Profile before booking.");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please enter both booking dates.");
      return;
    }

    const start = parseBookingDate(startDate);
    const end = parseBookingDate(endDate);
    if (!start || !end) {
      toast.error("Please use the dd/mm/yyyy format for both dates.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start.getTime() < today.getTime() || end.getTime() < today.getTime()) {
      toast.error("Booking dates must be today or in the future.");
      return;
    }

    if (end.getTime() < start.getTime()) {
      toast.error("End date must be on or after the start date.");
      return;
    }

    const diffDays = getBookingDurationDays(startDate, endDate);
    const dailyRate = Number(equipment.day ?? equipment.dailyRate ?? 0);
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      toast.error("This listing is missing a valid rental price.");
      return;
    }

    const amount = dailyRate * diffDays;
    const bookingStartDate = formatBookingDate(start);
    const bookingEndDate = formatBookingDate(end);

    const payload = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      ownerId: equipment.ownerId || "",
      ownerName: equipment.ownerName || "",
      farmerName: currentUser?.name || "Farmer",
      pickupLocation: ownerPickupLocation,
      deliveryLocation: farmerDropLocation,
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      dailyRate,
      totalAmount: amount,
      paymentMethod,
      notes: `Booked from frontend by ${currentUser?.email || "farmer"} | Pickup: ${ownerPickupLocation} | Drop: ${farmerDropLocation}`,
    };

    try {
      const latestEquipment = await getEquipmentById(id);
      if (!isEquipmentAvailable(latestEquipment)) {
        setEquipment(latestEquipment);
        toast.error("This equipment was just marked unavailable. Please choose another listing.");
        return;
      }
    } catch {
      // If the equipment service is unreachable here, continue with the current view.
    }

    try {
      const createdRental = await createRental(payload);
      const rentals = getStored(STORAGE_KEYS.rentals, []);
      const mergedRentals = mergeRentalsById([createdRental], rentals);
      setStored(STORAGE_KEYS.rentals, mergedRentals);
      toast.success("Booking created successfully.");
      notifyRentalUpdated();
      navigate("/farmer/bookings");
    } catch (error) {
      const status = error?.response?.status;
      const message = getApiErrorMessage(error, "Could not create booking.");
      if (status && status < 500) {
        if (/unavailable|already booked|not available/i.test(message)) {
          setEquipment((current) =>
            current
              ? {
                  ...current,
                  available: false,
                  status: "RESERVED",
                }
              : current
          );
        }
        toast.error(message);
        return;
      }

      const rentals = getStored(STORAGE_KEYS.rentals, []);
      const bookingId = `rental-${Date.now()}`;

      const fallbackRental = {
        id: bookingId,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        ownerId: equipment.ownerId || "",
        ownerName: equipment.ownerName || "",
        farmerId: currentUser?.email || "farmer@demo.com",
        farmerName: currentUser?.name || "Farmer",
        pickupLocation: ownerPickupLocation,
        deliveryLocation: farmerDropLocation,
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        dailyRate,
        status: "REQUESTED",
        totalAmount: amount,
        paymentMethod,
        notes: `Booked locally by ${currentUser?.email || "farmer"} | Pickup: ${ownerPickupLocation} | Drop: ${farmerDropLocation}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setStored(STORAGE_KEYS.rentals, mergeRentalsById([fallbackRental], rentals));
      toast.error("The rental service is unavailable. Saved the booking locally instead.");
      notifyRentalUpdated();
      navigate("/farmer/bookings");
    }
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
            {equipment.category} | {equipment.location}
          </div>
          {!isEquipmentAvailable(equipment) && (
            <div className="text-danger small mt-1">This listing is currently unavailable.</div>
          )}
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
                | Rs {equipment.week}/week | Rs {equipment.month}/month
              </span>
            </div>
            <div className="alert alert-success py-2 small mb-3">
              Message the owner before booking to confirm availability and delivery.
            </div>
            <div className="alert alert-info py-2 small mb-3">
              <div className="fw-semibold mb-1">Delivery route</div>
              <div>Pickup from owner: {ownerPickupLocation || "Owner location"}</div>
              <div>Drop at your address: {farmerDropLocation || "Add your profile address"}</div>
            </div>

            <div className="form-field">
              <label>Start date</label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                pattern="\\d{2}/\\d{2}/\\d{4}"
                maxLength={10}
                autoComplete="off"
              />
            </div>
            <div className="form-field">
              <label>End date</label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                pattern="\\d{2}/\\d{2}/\\d{4}"
                maxLength={10}
                autoComplete="off"
              />
            </div>
            <div className="text-muted small mb-3">Use the dd/mm/yyyy format for both dates.</div>
            <div className="alert alert-info py-2 small mb-3">
              Payments now use Razorpay test mode for a cleaner checkout flow.
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-warning" onClick={handleBooking} disabled={!isEquipmentAvailable(equipment)}>
                {isEquipmentAvailable(equipment) ? "Book Now" : "Unavailable"}
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
