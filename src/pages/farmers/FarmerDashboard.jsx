import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import heroImage from "../../assets/farmerbg.jpg";
import equipmentOne from "../../assets/hero.jpg";
import equipmentTwo from "../../assets/farmerbg.jpg";

const FarmDashboard = () => {
  const [displayName, setDisplayName] = useState("Farmer");

  useEffect(() => {
    const currentUser =
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(sessionStorage.getItem("currentUser")) ||
      JSON.parse(localStorage.getItem("user"));

    if (currentUser?.name) {
      setDisplayName(currentUser.name);
    } else if (currentUser?.email) {
      setDisplayName(currentUser.email.split("@")[0]);
    }
  }, []);

  const stats = [
    { value: "24", label: "Machines" },
    { value: "12", label: "Active rentals" },
    { value: "7", label: "Active bookings" },
  ];

  const quickActions = [
    { title: "Explore Equipment", subtitle: "Browse premium machinery", icon: "↗", tone: "mint", link: "/farmer/equipment" },
    { title: "My Bookings", subtitle: "Track your rentals", icon: "✓", tone: "sky", link: "/farmer/bookings" },
    { title: "Transactions", subtitle: "View payment history", icon: "₹", tone: "lavender", link: "/farmer/payments" },
    { title: "Messages", subtitle: "Chat with owners", icon: "✉", tone: "rose", link: "/farmer/messages" },
    { title: "Support", subtitle: "We’re here to help", icon: "?", tone: "teal", link: "/farmer" },
    { title: "Profile", subtitle: "Manage your details", icon: "⚙", tone: "amber", link: "/profile" },
  ];

  const featuredEquipment = [
    { name: "Tractor 35HP", description: "Powerful 35HP tractor suitable for ploughing and general farm work", day: "₹800/day", week: "₹5200/week", month: "₹20000/month", image: equipmentOne },
    { name: "Combine Harvester", description: "Modern combine harvester for wheat and rice harvesting", day: "₹2500/day", week: "₹16000/week", month: "₹60000/month", image: equipmentTwo },
    { name: "Crop Cutting Machine", description: "Efficient crop cutting machine for paddy and wheat", day: "₹600/day", week: "₹3800/week", month: "₹14000/month", image: equipmentOne },
  ];

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
            <Link to="/farmer/equipment" className="view-all">View All Equipment →</Link>
          </div>

          <div className="equipment-grid">
            {featuredEquipment.map((item) => (
              <div className="equipment-card" key={item.name}>
                <div
                  className="equipment-image"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className="equipment-body">
                  <h4 className="equipment-title">{item.name}</h4>
                  <p className="equipment-desc">{item.description}</p>
                  <div className="price-pill">
                    <span>{item.day}</span>
                    <span className="dot">•</span>
                    <span>{item.week}</span>
                    <span className="dot">•</span>
                    <span>{item.month}</span>
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
