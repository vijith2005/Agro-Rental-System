import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import heroImage from "../../assets/farmerbg.jpg";
import { listEquipment } from "../../api/equipmentApi";
import { listRentalsByFarmer } from "../../api/rentalApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { EQUIPMENT_UPDATED_EVENT } from "../../utils/equipmentEvents";
import { RENTAL_UPDATED_EVENT } from "../../utils/rentalEvents";
import { mergeRentalsById } from "../../utils/rentalCache";

const FarmDashboard = () => {
  const [displayName, setDisplayName] = useState("Farmer");
  const [equipments, setEquipments] = useState(() => getStored(STORAGE_KEYS.equipments, []));
  const [rentals, setRentals] = useState(() => getStored(STORAGE_KEYS.rentals, []));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser?.name) {
      setDisplayName(currentUser.name);
    } else if (currentUser?.email) {
      setDisplayName(currentUser.email.split("@")[0]);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadEquipment = async () => {
      try {
        const data = await listEquipment({ page: 0, size: 100 });
        const content = data?.content || [];
        if (!active) return;
        setEquipments(content);
        setStored(STORAGE_KEYS.equipments, content);
        setLoadError("");
      } catch {
        if (active) {
          setLoadError("Using cached equipment for now.");
        }
      }
    };

    loadEquipment();
    const handleEquipmentUpdated = () => {
      loadEquipment();
    };

    window.addEventListener(EQUIPMENT_UPDATED_EVENT, handleEquipmentUpdated);
    return () => {
      active = false;
      window.removeEventListener(EQUIPMENT_UPDATED_EVENT, handleEquipmentUpdated);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      const currentUser = getCurrentUser();
      const farmerId = currentUser?.email || "farmer@demo.com";
      const cached = getStored(STORAGE_KEYS.rentals, []).filter(
        (rental) => (rental.farmerId || "").toLowerCase() === farmerId.toLowerCase()
      );

      try {
        const data = await listRentalsByFarmer(farmerId);
        const content = mergeRentalsById(Array.isArray(data) ? data : [], cached);
        if (!active) return;
        setRentals(content);
        setStored(STORAGE_KEYS.rentals, content);
      } catch {
        if (!active) return;
        setRentals(cached);
      }
    };

    loadRentals();
    const handleRentalUpdated = () => loadRentals();
    window.addEventListener(RENTAL_UPDATED_EVENT, handleRentalUpdated);
    return () => {
      active = false;
      window.removeEventListener(RENTAL_UPDATED_EVENT, handleRentalUpdated);
    };
  }, []);

  const stats = useMemo(
    () => [
      { value: equipments.length.toString(), label: "Machines" },
      {
        value: rentals.filter((item) => ["APPROVED", "SCHEDULED", "IN_TRANSIT", "DELIVERED", "IN_USE"].includes((item.status || "").toUpperCase())).length.toString(),
        label: "Active rentals",
      },
      {
        value: rentals
          .filter((item) => ["REQUESTED", "PENDING", "APPROVED", "SCHEDULED"].includes((item.status || "").toUpperCase()))
          .length.toString(),
        label: "Active bookings",
      },
    ],
    [equipments.length, rentals]
  );

  const quickActions = [
    { title: "Explore Equipment", subtitle: "Browse premium machinery", icon: "→", tone: "mint", link: "/farmer/equipment" },
    { title: "My Bookings", subtitle: "Track your rentals", icon: "✓", tone: "sky", link: "/farmer/bookings" },
    { title: "Transactions", subtitle: "View payment history", icon: "₹", tone: "lavender", link: "/farmer/payments" },
    { title: "Messages", subtitle: "Chat with owners", icon: "✉", tone: "rose", link: "/farmer/messages" },
    { title: "Profile", subtitle: "Manage your details", icon: "⚙", tone: "amber", link: "/profile" },
  ];

  const featuredEquipment = useMemo(
    () =>
      (equipments || [])
        .slice()
        .sort((left, right) => (Number(right.rating) || 0) - (Number(left.rating) || 0))
        .slice(0, 3),
    [equipments]
  );

  return (
    <div className="dashboard agr-dash">
      <div className="main-content">
        <section className="hero-card template-hero" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="hero-overlay template-hero-overlay">
            <p className="welcome-kicker">WELCOME BACK, {displayName.toUpperCase()}</p>
            <h2 className="hub-title">Your Agricultural Hub</h2>
            <p className="description">Access premium equipment to optimize your farm operations</p>
          </div>
        </section>

        {loadError && <div className="alert alert-warning mt-3">{loadError}</div>}

        <div className="stats stats-pill">
          {stats.map((stat) => (
            <div className="stat-item stat-pill" key={stat.label}>
              <span className="stat-number">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <section className="quick-actions">
          <div className="section-header">
            <div>
              <h3 className="section-title">Quick Actions</h3>
              <p className="section-subtitle">Everything you need at your fingertips</p>
            </div>
          </div>

          <div className="action-grid">
            {quickActions.map((action) => (
              <Link
                to={action.link}
                className={`action-card tone-${action.tone}`}
                key={action.title}
              >
                <div className="action-top">
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-arrow">→</div>
                </div>
                <h4 className="action-title">{action.title}</h4>
                <p className="action-subtitle">{action.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="equipment-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">Featured Equipment</h3>
              <p className="section-subtitle">Top-rated agricultural machinery in your area</p>
            </div>
            <Link to="/farmer/equipment" className="view-all text-success">
              View All Equipment →
            </Link>
          </div>

          <div className="equipment-grid">
            {featuredEquipment.map((item) => (
              <div className="equipment-card" key={item.id}>
                <div
                  className="equipment-image"
                  style={{ backgroundImage: `url(${item.imageUrl || heroImage})` }}
                />
                <div className="equipment-body">
                  <h4 className="equipment-title">{item.name}</h4>
                  <p className="equipment-desc">{item.description}</p>
                  <div className="price-pill">
                    <span>Rs {item.day}/day</span>
                    <span className="dot">•</span>
                    <span>Rs {item.week}/week</span>
                    <span className="dot">•</span>
                    <span>Rs {item.month}/month</span>
                  </div>
                  <Link to="/farmer/equipment" className="rent-now">
                    Rent Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FarmDashboard;
