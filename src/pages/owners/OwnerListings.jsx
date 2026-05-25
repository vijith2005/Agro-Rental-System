import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { createEquipment, listEquipment } from "../../api/equipmentApi";
import { getStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { notifyEquipmentUpdated } from "../../utils/equipmentEvents";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import heroImage from "../../assets/hero.jpg";

const CATEGORY_OPTIONS = ["Tractor", "Harvester", "Sprayer", "Seeder", "Pump"];
const OTHER_CATEGORY_OPTION = "Others";

const OwnerListings = () => {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [equipments, setEquipments] = useState(() => getStored(STORAGE_KEYS.equipments, []));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const currentUser = getCurrentUser();
  const ownerKey = currentUser?.email || "owner@demo.com";

  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [formState, setFormState] = useState({
    name: "",
    category: "Tractor",
    customCategory: "",
    day: 800,
    location: "",
    lat: 11.0168,
    lng: 76.9558,
    imageUrl: "",
  });

  const loadMyListings = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await listEquipment({ ownerId: ownerKey, page: 0, size: 100 });
      const content = data?.content || [];
      setEquipments(content);
    } catch {
      setLoadError("Showing cached equipment because the backend is unavailable.");
      setEquipments(getStored(STORAGE_KEYS.equipments, []).filter((item) => !item.ownerId || item.ownerId === ownerKey));
    } finally {
      setIsLoading(false);
    }
  }, [ownerKey]);

  useEffect(() => {
    loadMyListings();
  }, [loadMyListings]);

  const handleMapSelect = async (event) => {
    const { lat, lng } = event.latlng;
    setLocateError("");
    setIsLocating(true);

    const latFixed = Number(lat.toFixed(6));
    const lngFixed = Number(lng.toFixed(6));

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latFixed}&lon=${lngFixed}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const readable = data?.display_name;

      setFormState((prev) => ({
        ...prev,
        lat: latFixed,
        lng: lngFixed,
        location: readable || `Lat ${latFixed}, Lng ${lngFixed}`,
      }));
    } catch {
      setLocateError("Couldn't fetch address, using coordinates instead.");
      setFormState((prev) => ({
        ...prev,
        lat: latFixed,
        lng: lngFixed,
        location: `Lat ${latFixed}, Lng ${lngFixed}`,
      }));
    } finally {
      setIsLocating(false);
    }
  };

  const LocationPickerMarker = ({ position }) => {
    useMapEvents({
      click: handleMapSelect,
    });

    return position ? <Marker position={position} /> : null;
  };

  const myListings = useMemo(
    () => equipments.filter((item) => !item.ownerId || item.ownerId === ownerKey),
    [equipments, ownerKey]
  );

  const handleAddListing = async (event) => {
    event.preventDefault();
    setSaveError("");

    if (!formState.name.trim()) return;

    const selectedCategory =
      formState.category === OTHER_CATEGORY_OPTION ? formState.customCategory.trim() : formState.category;

    if (!selectedCategory) {
      setSaveError("Enter a custom category when you choose Others.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formState.name.trim(),
        category: selectedCategory,
        description: "Owner listed equipment",
        day: Number(formState.day) || 0,
        week: Number(formState.day) ? Number(formState.day) * 6 : undefined,
        month: Number(formState.day) ? Number(formState.day) * 24 : undefined,
        location: formState.location || "Region",
        rating: 4.5,
        imageKey: "hero",
        imageUrl: formState.imageUrl?.trim() || "",
        ownerName: currentUser?.name || "Owner",
        lat: Number(formState.lat) || 11.0168,
        lng: Number(formState.lng) || 76.9558,
        status: "AVAILABLE",
      };

      const created = await createEquipment(payload);
      const next = [created, ...myListings.filter((item) => item.id !== created.id)];
      setEquipments(next);
      notifyEquipmentUpdated();
      setFormState({
        name: "",
        category: "Tractor",
        customCategory: "",
        day: 800,
        location: "",
        lat: 11.0168,
        lng: 76.9558,
        imageUrl: "",
      });
    } catch (error) {
      setSaveError(error?.response?.data?.message || "Unable to save listing right now.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(myListings.length / pageSize));
  const pageItems = myListings.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visiblePages = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="agr-page owner-dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">My Listings</div>
          <div className="page-subtitle">Add and manage equipment listings</div>
        </div>
        <Link to="/owner" className="gradient-pill">
          Back to Dashboard
        </Link>
      </div>

      {loadError && <div className="alert alert-warning">{loadError}</div>}
      {saveError && <div className="alert alert-danger">{saveError}</div>}

      <div className="detail-card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleAddListing}>
          <div className="form-field">
            <label>Pick location on map</label>
            <div className="map-card" style={{ height: 320, width: "100%", marginBottom: 12 }}>
              <MapContainer
                center={[Number(formState.lat) || 11.0168, Number(formState.lng) || 76.9558]}
                zoom={7}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <LocationPickerMarker position={[Number(formState.lat), Number(formState.lng)]} />
              </MapContainer>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Click anywhere on the map to drop a pin and auto-fill the location fields.
            </div>
            {isLocating && <div className="muted" style={{ fontSize: 12 }}>Fetching place name...</div>}
            {locateError && <div className="text-danger" style={{ fontSize: 12 }}>{locateError}</div>}
          </div>
          <div className="form-field">
            <label>Equipment name</label>
            <input
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label>Category</label>
            <select
              value={formState.category}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  category: event.target.value,
                  customCategory: event.target.value === OTHER_CATEGORY_OPTION ? prev.customCategory : "",
                }))
              }
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
              <option>{OTHER_CATEGORY_OPTION}</option>
            </select>
          </div>
          {formState.category === OTHER_CATEGORY_OPTION && (
            <div className="form-field">
              <label>Custom category</label>
              <input
                value={formState.customCategory}
                onChange={(event) => setFormState((prev) => ({ ...prev, customCategory: event.target.value }))}
                placeholder="Enter product type"
              />
            </div>
          )}
          <div className="form-field">
            <label>Price per day</label>
            <input
              type="number"
              value={formState.day}
              onChange={(event) => setFormState((prev) => ({ ...prev, day: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label>Image URL (public)</label>
            <input
              value={formState.imageUrl}
              onChange={(event) => setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="https://example.com/photo.jpg"
            />
            <div className="muted" style={{ fontSize: 12 }}>
              Paste a product photo link; defaults to the app hero if empty.
            </div>
          </div>
          <div className="form-field">
            <label>Location</label>
            <input readOnly value={formState.location} placeholder="Click the map above to set location" />
          </div>
          <div className="form-field">
            <label>Latitude</label>
            <input
              type="number"
              value={formState.lat}
              onChange={(event) => setFormState((prev) => ({ ...prev, lat: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label>Longitude</label>
            <input
              type="number"
              value={formState.lng}
              onChange={(event) => setFormState((prev) => ({ ...prev, lng: event.target.value }))}
            />
          </div>
          <button className="primary-btn" type="submit" disabled={saving || isLoading}>
            {saving ? "Saving..." : "Add Listing"}
          </button>
        </form>
      </div>

      <div className="list-shell">
        {isLoading ? (
          <div className="detail-card">Loading your listings...</div>
        ) : (
          <>
            <div className="list-grid">
              {pageItems.map((item) => (
                <div
                  key={item.id}
                  className="list-card"
                  style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 12, alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundImage: `url(${item.imageUrl || heroImage})`,
                      border: "1px solid #eef1f4",
                    }}
                  />
                  <div>
                    <div className="equipment-name">{item.name}</div>
                    <div className="list-meta">
                      {item.category} • {item.location} • Rs {item.day}/day
                    </div>
                  </div>
                  <span className="status-pill status-approved">ACTIVE</span>
                </div>
              ))}
            </div>
            <div className="messages-pagination">
              <div className="page-info">
                Page {page} of {totalPages}
              </div>
              <div className="page-actions">
                <button
                  className="page-btn"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`page-btn ${page === pageNumber ? "active" : ""}`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerListings;
