import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, STORAGE_KEYS } from "../../utils/storage";
import heroImage from "../../assets/hero.jpg";
import farmerImage from "../../assets/farmerbg.jpg";

const imageMap = {
  hero: heroImage,
  farmer: farmerImage,
};

const categoriesList = ["All", "Tractor", "Harvester", "Sprayer", "Seeder", "Pump", "Cutter", "Other"];

const EquipmentBrowse = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    location: "All",
    minPrice: "",
    maxPrice: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const equipments = getStored(STORAGE_KEYS.equipments, []);
  const locations = useMemo(
    () => ["All", ...new Set(equipments.map((item) => item.location))],
    [equipments]
  );

  const filtered = useMemo(() => {
    const term = filters.search.toLowerCase();
    return equipments.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term);
      const matchesCategory = filters.category === "All" || item.category === filters.category;
      const matchesLocation = filters.location === "All" || item.location === filters.location;
      const price = item.day || 0;
      const matchesMin = filters.minPrice ? price >= Number(filters.minPrice) : true;
      const matchesMax = filters.maxPrice ? price <= Number(filters.maxPrice) : true;
      return matchesSearch && matchesCategory && matchesLocation && matchesMin && matchesMax;
    });
  }, [equipments, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const renderStars = (ratingValue) => {
    const rating = Number(ratingValue) || 0;
    const full = Math.round(rating);
    return Array.from({ length: 5 }).map((_, idx) => (
      <span key={idx} className={idx < full ? "star filled" : "star"}>
        ★
      </span>
    ));
  };

  return (
    <div className="agr-page">
      {/* Page header */}
      <div className="equipment-hero card shadow-sm mb-4" style={{ backgroundImage: `linear-gradient(135deg, rgba(27,67,50,0.92), rgba(64,145,108,0.85)), url(${heroImage})` }}>
        <div className="equipment-hero-body">
          <p className="eyebrow text-uppercase text-light mb-2">Equipment Marketplace</p>
          <h2 className="text-white mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Find the right machine for your next job
          </h2>
          <p className="text-light mb-0">Browse, filter, and book in a few clicks.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Search equipment..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filters.category}
              onChange={(e) => updateFilter("category", e.target.value)}
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Location</label>
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Min Price (₹/day)</label>
            <input
              type="number"
              className="form-control"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Max Price (₹/day)</label>
            <input
              type="number"
              className="form-control"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-1 d-grid">
            <button className="btn btn-warning" onClick={() => setFilters({ search: "", category: "All", location: "All", minPrice: "", maxPrice: "" })}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="row g-4">
        {pageItems.map((item) => (
          <div className="col-lg-4 col-md-6" key={item.id}>
            <div className="card h-100 equipment-card-new">
              <div
                className="equipment-thumb-new"
                style={{ backgroundImage: `url(${item.imageUrl || imageMap[item.imageKey] || heroImage})` }}
              />
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title mb-0" style={{ fontFamily: "Playfair Display, serif", color: "var(--primary)" }}>
                    {item.name}
                  </h5>
                  <span className="badge bg-light text-primary border">{item.category}</span>
                </div>
                <p className="text-muted small mb-2">
                  {item.ownerName} • {item.location}
                </p>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="rating">{renderStars(item.rating)}</div>
                  <span className="small text-muted">{(Number(item.rating) || 0).toFixed(1)}</span>
                </div>
                <div className="fw-bold mb-2" style={{ color: "var(--primary)" }}>
                  ₹{item.day}/day
                </div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-success">Available</span>
                  <span className="badge bg-secondary">₹{item.week}/week</span>
                  <span className="badge bg-secondary">₹{item.month}/month</span>
                </div>
                <div className="d-grid gap-2">
                  <Link to={`/farmer/equipment/${item.id}`} className="btn btn-warning">
                    Book Now
                  </Link>
                  <Link to={`/farmer/equipment/${item.id}`} className="btn btn-view-outline">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {pageItems.length === 0 && (
          <div className="col-12">
            <div className="alert alert-warning mb-0">No equipment matches your filters.</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
        <div className="text-muted small">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </div>
        <nav aria-label="Equipment pagination">
          <ul className="pagination mb-0">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            </li>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <li key={idx} className={`page-item ${page === idx + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(idx + 1)}>{idx + 1}</button>
              </li>
            ))}
            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default EquipmentBrowse;
