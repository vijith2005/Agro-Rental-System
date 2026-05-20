import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import heroImage from "../../assets/hero.jpg";
import fieldImage from "../../assets/farmerbg.jpg";
import { listEquipment } from "../../api/equipmentApi";
import { listRentalsByOwner } from "../../api/rentalApi";
import { listPaymentsByOwner } from "../../api/paymentApi";
import { getStored, STORAGE_KEYS } from "../../utils/storage";
import { getCurrentUser } from "../../utils/session";
import { EQUIPMENT_UPDATED_EVENT } from "../../utils/equipmentEvents";
import { RENTAL_UPDATED_EVENT } from "../../utils/rentalEvents";
import { PAYMENT_UPDATED_EVENT } from "../../utils/paymentEvents";

const formatCurrency = (amount) =>
  `Rs ${new Intl.NumberFormat("en-IN").format(Number(amount) || 0)}`;

const paginateItems = (items, currentPage, pageSize) =>
  items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

const getTotalPages = (items, pageSize) =>
  Math.max(1, Math.ceil(items.length / pageSize));

const getVisiblePages = (currentPage, totalPages) => {
  const windowSize = 4;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + windowSize - 1);

  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const formatMessageStamp = (value) => {
  if (!value) return "Awaiting reply";

  const stamp = new Date(value);
  if (Number.isNaN(stamp.getTime())) return "Awaiting reply";

  return stamp.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

function OwnerDashboard() {
  const [displayName, setDisplayName] = useState("Owner");
  const [equipments, setEquipments] = useState(() => getStored(STORAGE_KEYS.equipments, []));
  const [rentals, setRentals] = useState(() => getStored(STORAGE_KEYS.rentals, []));
  const [payments, setPayments] = useState(() => getStored(STORAGE_KEYS.payments, []));
  const [loadError, setLoadError] = useState("");
  const [paymentWarning, setPaymentWarning] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [pages, setPages] = useState({
    performance: 1,
    requests: 1,
    locations: 1,
    messages: 1,
  });

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
      const currentUser = getCurrentUser();
      const ownerId = currentUser?.email || "owner@demo.com";

      try {
        const data = await listEquipment({ ownerId, page: 0, size: 100 });
        const content = data?.content || [];
        if (!active) return;
        setEquipments(content);
        setLoadError("");
      } catch {
        if (active) {
          const cached = getStored(STORAGE_KEYS.equipments, []).filter(
            (item) => !item.ownerId || item.ownerId === ownerId
          );
          setEquipments(cached);
          if (cached.length === 0) {
            setLoadError("Using cached equipment because the backend is unavailable.");
          } else {
            setLoadError("");
          }
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

  const chats = getStored(STORAGE_KEYS.chats, []);

  const ownerKey = useMemo(() => {
    const currentUser = getCurrentUser();
    return currentUser?.email || "owner@demo.com";
  }, []);

  const myListings = useMemo(
    () => equipments.filter((item) => !item.ownerId || item.ownerId === ownerKey),
    [equipments, ownerKey]
  );

  useEffect(() => {
    let active = true;

    const loadRentals = async () => {
      const currentUser = getCurrentUser();
      const ownerId = currentUser?.email || "owner@demo.com";

      try {
        const data = await listRentalsByOwner(ownerId);
        const content = Array.isArray(data) ? data : [];
        if (!active) return;
        setRentals(content);
        setStored(STORAGE_KEYS.rentals, content);
      } catch {
        if (!active) return;
        const cached = getStored(STORAGE_KEYS.rentals, []).filter(
          (item) => !item.ownerId || item.ownerId === ownerId
        );
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

  useEffect(() => {
    let active = true;

    const loadPayments = async () => {
      const currentUser = getCurrentUser();
      const ownerId = currentUser?.email || "owner@demo.com";

      try {
        const data = await listPaymentsByOwner(ownerId);
        const content = Array.isArray(data) ? data : [];
        if (!active) return;
        setPayments(content);
        setStored(STORAGE_KEYS.payments, content);
        setPaymentWarning("");
      } catch {
        if (!active) return;
        const cached = getStored(STORAGE_KEYS.payments, []).filter(
          (payment) => !payment.ownerId || payment.ownerId === ownerId
        );
        setPayments(cached);
        if (cached.length === 0) {
          setPaymentWarning("Using cached payments because the backend is unavailable.");
        } else {
          setPaymentWarning("");
        }
      }
    };

    loadPayments();
    const handlePaymentUpdated = () => loadPayments();
    window.addEventListener(PAYMENT_UPDATED_EVENT, handlePaymentUpdated);
    return () => {
      active = false;
      window.removeEventListener(PAYMENT_UPDATED_EVENT, handlePaymentUpdated);
    };
  }, []);

  const ownerRentals = useMemo(
    () => rentals.filter((rental) => (rental.ownerId || "").toLowerCase() === ownerKey.toLowerCase()),
    [rentals, ownerKey]
  );

  const settledPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          (payment.ownerId || "").toLowerCase() === ownerKey.toLowerCase() &&
          (payment.status || "").toUpperCase() === "PAID"
      ),
    [ownerKey, payments]
  );

  const pendingRequests = useMemo(
    () => ownerRentals.filter((rental) => rental.status === "REQUESTED"),
    [ownerRentals]
  );

  const totalEarnings = settledPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const ownerThreads = useMemo(
    () => chats.filter((thread) => thread.ownerId === ownerKey),
    [chats, ownerKey]
  );

  const locationCards = useMemo(() => {
    const counts = myListings.reduce((acc, item) => {
      const location = item.location || "Unknown";
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((left, right) => right.count - left.count || left.location.localeCompare(right.location));
  }, [myListings]);

  const performanceCards = useMemo(
    () => [
      {
        label: "Settled Payments",
        value: settledPayments.length,
        detail: "Bookings settled successfully",
      },
      {
        label: "Active Listings",
        value: myListings.length,
        detail: "Machines currently visible to farmers",
      },
      {
        label: "Pending Requests",
        value: pendingRequests.length,
        detail: "Requests waiting for your action",
      },
      {
        label: "Live Conversations",
        value: ownerThreads.length,
        detail: "Open chat threads with farmers",
      },
      {
        label: "Locations Covered",
        value: locationCards.length,
        detail: "Service areas with active inventory",
      },
      {
        label: "Revenue Earned",
        value: formatCurrency(totalEarnings),
        detail: "Paid value collected so far",
      },
    ],
    [locationCards.length, myListings.length, ownerThreads.length, pendingRequests.length, settledPayments.length, totalEarnings]
  );

  const messageCards = useMemo(
    () =>
      ownerThreads
        .map((thread) => {
          const lastMessage = (thread.messages || []).at(-1);
          const lastStamp = lastMessage?.createdAt || lastMessage?.at;
          return {
            id: thread.id,
            farmerName: thread.farmerName || "Farmer",
            equipmentName: thread.equipmentName || "Equipment",
            unread: thread.unreadForOwner || 0,
            preview: lastMessage?.text || "No messages yet.",
            stamp: formatMessageStamp(lastStamp),
            sortValue: lastStamp ? new Date(lastStamp).getTime() : 0,
          };
        })
        .sort(
          (left, right) =>
            right.unread - left.unread || right.sortValue - left.sortValue
        ),
    [ownerThreads]
  );

  const notifications = [
    {
      label: "Request queue",
      value: `${pendingRequests.length} open`,
      copy: "Stay on top of new booking approvals before the next delivery slot fills up.",
    },
    {
      label: "Coverage",
      value: `${locationCards.length} zones`,
      copy: "Track where your listings are concentrated and where expansion could help.",
    },
    {
      label: "Inbox health",
      value: `${messageCards.filter((thread) => thread.unread > 0).length} unread`,
      copy: "Unread conversations are surfaced first so no farmer waits too long.",
    },
  ];

  const carouselSlides = useMemo(
    () => [
      {
        id: "inventory",
        image: heroImage,
        eyebrow: "Inventory in focus",
        title: "Present your best equipment with a stronger first impression",
        description:
          "Use the dashboard to keep your fleet visible, current, and ready for the next booking cycle.",
        statPrimary: `${myListings.length} live listings`,
        statSecondary: `${pendingRequests.length} fresh requests`,
      },
      {
        id: "coverage",
        image: fieldImage,
        eyebrow: "Regional coverage",
        title: "Expand across high-demand locations without losing operational clarity",
        description:
          "Watch which service areas perform best and balance equipment where farmers are actively searching.",
        statPrimary: `${locationCards.length} service areas`,
        statSecondary: `${ownerThreads.length} active chats`,
      },
      {
        id: "earnings",
        image: heroImage,
        eyebrow: "Revenue tracking",
        title: "See bookings, payouts, and conversations in one clean command center",
        description:
          "Your owner home now keeps requests, performance, locations, and messages aligned in one place.",
        statPrimary: formatCurrency(totalEarnings),
        statSecondary: `${settledPayments.length} settled payments`,
      },
    ],
    [locationCards.length, myListings.length, ownerThreads.length, pendingRequests.length, settledPayments.length, totalEarnings]
  );

  useEffect(() => {
    if (carouselSlides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselSlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [carouselSlides.length]);

  const performancePerPage = 3;
  const requestsPerPage = 3;
  const locationsPerPage = 4;
  const messagesPerPage = 3;

  const performanceTotalPages = getTotalPages(
    performanceCards,
    performancePerPage
  );
  const requestTotalPages = getTotalPages(pendingRequests, requestsPerPage);
  const locationTotalPages = getTotalPages(locationCards, locationsPerPage);
  const messageTotalPages = getTotalPages(messageCards, messagesPerPage);

  useEffect(() => {
    setPages((current) => {
      const next = {
        performance: Math.min(current.performance, performanceTotalPages),
        requests: Math.min(current.requests, requestTotalPages),
        locations: Math.min(current.locations, locationTotalPages),
        messages: Math.min(current.messages, messageTotalPages),
      };

      return next.performance === current.performance &&
        next.requests === current.requests &&
        next.locations === current.locations &&
        next.messages === current.messages
        ? current
        : next;
    });
  }, [
    locationTotalPages,
    messageTotalPages,
    performanceTotalPages,
    requestTotalPages,
  ]);

  const pagedPerformance = paginateItems(
    performanceCards,
    pages.performance,
    performancePerPage
  );
  const pagedRequests = paginateItems(
    pendingRequests,
    pages.requests,
    requestsPerPage
  );
  const pagedLocations = paginateItems(
    locationCards,
    pages.locations,
    locationsPerPage
  );
  const pagedMessages = paginateItems(
    messageCards,
    pages.messages,
    messagesPerPage
  );

  const updatePage = (section, nextPage) => {
    setPages((current) => ({ ...current, [section]: nextPage }));
  };

  const renderPagination = (section, currentPage, totalPages, itemsLength) => {
    if (itemsLength <= 0 || totalPages <= 1) return null;

    return (
      <div className="owner-pagination">
        <div className="owner-page-info">
          Page {currentPage} of {totalPages}
        </div>
        <div className="owner-page-actions">
          <button
            type="button"
            className="owner-page-btn"
            onClick={() => updatePage(section, Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {getVisiblePages(currentPage, totalPages).map((pageNumber) => (
            <button
              type="button"
              key={`${section}-${pageNumber}`}
              className={`owner-page-btn ${
                currentPage === pageNumber ? "active" : ""
              }`}
              onClick={() => updatePage(section, pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="owner-page-btn"
            onClick={() =>
              updatePage(section, Math.min(currentPage + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="agr-page owner-dashboard owner-home-page">
      {loadError && myListings.length === 0 && (
        <div className="alert alert-warning mb-3">{loadError}</div>
      )}
      {paymentWarning && <div className="alert alert-warning mb-3">{paymentWarning}</div>}
      <div className="owner-topbar">
        <div>
          <div className="owner-title">Seller Central</div>
          <div className="owner-subtitle">
            Welcome back, {displayName}. Monitor listings, requests, earnings,
            and farmer conversations from one place.
          </div>
        </div>
        <div className="owner-actions">
          <Link to="/owner/requests" className="owner-btn owner-btn-secondary">
            View Requests
          </Link>
          <Link to="/owner/listings" className="owner-btn">
            Manage Listings
          </Link>
        </div>
      </div>

      <div className="owner-hero-grid">
        <section className="owner-carousel">
          <div className="owner-carousel-stage">
            {carouselSlides.map((slide, index) => (
              <article
                key={slide.id}
                className={`owner-carousel-slide ${
                  index === activeSlide ? "is-active" : ""
                }`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="owner-carousel-overlay" />
                <div className="owner-carousel-content">
                  <span className="owner-carousel-kicker">{slide.eyebrow}</span>
                  <h2 className="owner-carousel-title">{slide.title}</h2>
                  <p className="owner-carousel-copy">{slide.description}</p>
                  <div className="owner-carousel-metrics">
                    <div className="owner-carousel-chip">{slide.statPrimary}</div>
                    <div className="owner-carousel-chip muted">
                      {slide.statSecondary}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="owner-carousel-controls">
            <button
              type="button"
              className="owner-carousel-nav"
              onClick={() =>
                setActiveSlide(
                  (current) =>
                    (current - 1 + carouselSlides.length) % carouselSlides.length
                )
              }
              aria-label="Previous slide"
            >
              Prev
            </button>
            <div className="owner-carousel-dots">
              {carouselSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`owner-carousel-dot ${
                    index === activeSlide ? "is-active" : ""
                  }`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="owner-carousel-nav"
              onClick={() =>
                setActiveSlide((current) => (current + 1) % carouselSlides.length)
              }
              aria-label="Next slide"
            >
              Next
            </button>
          </div>
        </section>

        <aside className="owner-panel owner-panel-emphasis">
          <div className="owner-panel-head">
            <div>
              <div className="owner-panel-kicker">Today at a glance</div>
              <div className="owner-panel-title">Operational Notes</div>
            </div>
          </div>
          <div className="owner-panel-body owner-note-stack">
            {notifications.map((note) => (
              <div className="owner-note-card" key={note.label}>
                <div className="owner-note-top">
                  <span className="owner-note-label">{note.label}</span>
                  <span className="owner-pill">{note.value}</span>
                </div>
                <p className="owner-note-copy">{note.copy}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="owner-metrics">
        <div className="owner-metric-card">
          <div className="metric-label">Listings</div>
          <div className="metric-value">{myListings.length}</div>
        </div>
        <div className="owner-metric-card">
          <div className="metric-label">Pending Requests</div>
          <div className="metric-value">{pendingRequests.length}</div>
        </div>
        <div className="owner-metric-card">
          <div className="metric-label">Total Earnings</div>
          <div className="metric-value">{formatCurrency(totalEarnings)}</div>
        </div>
      </div>

      <div className="owner-grid">
        <div className="owner-column">
          <div className="owner-panel">
            <div className="owner-panel-head">
              <div>
                <div className="owner-panel-kicker">Performance</div>
                <div className="owner-panel-title">Performance Snapshot</div>
              </div>
              <span className="owner-panel-count">{performanceCards.length}</span>
            </div>
            <div className="owner-panel-body owner-highlight-grid">
              {pagedPerformance.map((metric) => (
                <div className="owner-highlight-card" key={metric.label}>
                  <span className="owner-highlight-label">{metric.label}</span>
                  <strong className="owner-highlight-value">{metric.value}</strong>
                  <span className="owner-highlight-meta">{metric.detail}</span>
                </div>
              ))}
            </div>
            {renderPagination(
              "performance",
              pages.performance,
              performanceTotalPages,
              performanceCards.length
            )}
          </div>

          <div className="owner-panel">
            <div className="owner-panel-head">
              <div>
                <div className="owner-panel-kicker">Requests</div>
                <div className="owner-panel-title">Recent Requests</div>
              </div>
              <Link to="/owner/requests" className="owner-panel-link">
                Open queue
              </Link>
            </div>
            <div className="owner-panel-body owner-list-stack">
              {pagedRequests.map((request) => (
                <div className="owner-list-item" key={request.id}>
                  <div className="owner-list-copy">
                    <div className="owner-list-title">
                      {request.equipmentName || "Equipment"}
                    </div>
                    <div className="owner-list-meta">
                      {request.startDate} to {request.endDate} |{" "}
                      {request.farmerName || "Farmer"} |{" "}
                      {formatCurrency(request.totalAmount)}
                    </div>
                  </div>
                  <span className="owner-pill">Requested</span>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="owner-empty">No pending requests right now.</div>
              )}
            </div>
            {renderPagination(
              "requests",
              pages.requests,
              requestTotalPages,
              pendingRequests.length
            )}
          </div>
        </div>

        <div className="owner-column">
          <div className="owner-panel">
            <div className="owner-panel-head">
              <div>
                <div className="owner-panel-kicker">Coverage</div>
                <div className="owner-panel-title">Locations</div>
              </div>
              <span className="owner-panel-count">{locationCards.length}</span>
            </div>
            <div className="owner-panel-body owner-list-stack">
              {pagedLocations.map((item) => (
                <div className="owner-list-item" key={item.location}>
                  <div className="owner-list-copy">
                    <div className="owner-list-title">{item.location}</div>
                    <div className="owner-list-meta">
                      {item.count} listing{item.count === 1 ? "" : "s"} available
                    </div>
                  </div>
                  <span className="owner-pill">{item.count}</span>
                </div>
              ))}
              {locationCards.length === 0 && (
                <div className="owner-empty">Add listings to see location data.</div>
              )}
            </div>
            {renderPagination(
              "locations",
              pages.locations,
              locationTotalPages,
              locationCards.length
            )}
          </div>

          <div className="owner-panel">
            <div className="owner-panel-head">
              <div>
                <div className="owner-panel-kicker">Inbox</div>
                <div className="owner-panel-title">Messages</div>
              </div>
              <Link to="/owner/messages" className="owner-panel-link">
                Open inbox
              </Link>
            </div>
            <div className="owner-panel-body owner-list-stack">
              {pagedMessages.map((thread) => (
                <div className="owner-list-item" key={thread.id}>
                  <div className="owner-list-copy">
                    <div className="owner-list-row">
                      <div className="owner-list-title">{thread.farmerName}</div>
                      <div className="owner-list-stamp">{thread.stamp}</div>
                    </div>
                    <div className="owner-list-meta">{thread.equipmentName}</div>
                    <div className="owner-list-preview">{thread.preview}</div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    {thread.unread > 0 ? (
                      <span className="owner-pill alert">{thread.unread}</span>
                    ) : (
                      <span className="owner-pill">Ready</span>
                    )}
                    <Link to={`/owner/messages?rentalId=${encodeURIComponent(thread.id)}`} className="owner-panel-link">
                      Open thread
                    </Link>
                  </div>
                </div>
              ))}
              {messageCards.length === 0 && (
                <div className="owner-empty">No messages yet.</div>
              )}
            </div>
            {renderPagination(
              "messages",
              pages.messages,
              messageTotalPages,
              messageCards.length
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
