import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, STORAGE_KEYS } from "../../utils/storage";
import { readStoredUser } from "../../utils/authApi";

function OwnerDashboard() {
  const [displayName, setDisplayName] = useState("Owner");
  const [requestPage, setRequestPage] = useState(1);

  useEffect(() => {
    const currentUser = readStoredUser();

    if (currentUser?.name) {
      setDisplayName(currentUser.name);
    } else if (currentUser?.email) {
      setDisplayName(currentUser.email.split("@")[0]);
    }
  }, []);

  const equipments = getStored(STORAGE_KEYS.equipments, []);
  const rentals = getStored(STORAGE_KEYS.rentals, []);
  const invoices = getStored(STORAGE_KEYS.invoices, []);
  const chats = getStored(STORAGE_KEYS.chats, []);

  const ownerKey = useMemo(() => {
    const currentUser = readStoredUser();
    return currentUser?.email || "owner@demo.com";
  }, []);

  const myListings = equipments.filter(
    (item) => !item.ownerId || item.ownerId === ownerKey
  );

  const pendingRequests = rentals.filter(
    (rental) => rental.status === "REQUESTED"
  );

  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const totalEarnings = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const ownerThreads = chats.filter((thread) => thread.ownerId === ownerKey);

  const locationCounts = useMemo(() => {
    return myListings.reduce((acc, item) => {
      acc[item.location] = (acc[item.location] || 0) + 1;
      return acc;
    }, {});
  }, [myListings]);

  const notifications = [
    { label: "Pending requests", value: pendingRequests.length },
    { label: "Active listings", value: myListings.length },
    { label: "Paid invoices", value: paidInvoices.length },
  ];

  const requestsPerPage = 4;
  const totalRequestPages = Math.max(
    1,
    Math.ceil(pendingRequests.length / requestsPerPage)
  );

  useEffect(() => {
    if (requestPage > totalRequestPages) {
      setRequestPage(totalRequestPages);
    }
  }, [requestPage, totalRequestPages]);

  const requestStartIndex = (requestPage - 1) * requestsPerPage;
  const pagedRequests = pendingRequests.slice(
    requestStartIndex,
    requestStartIndex + requestsPerPage
  );

  return (
    <div className="agr-page owner-dashboard">
      <div className="owner-topbar">
        <div>
          <div className="owner-title">Seller Central</div>
          <div className="owner-subtitle">
            Welcome back, {displayName}. Monitor listings, requests, and earnings.
          </div>
        </div>
        <div className="owner-actions">
          <Link to="/owner/listings" className="owner-btn">
            Manage Listings
          </Link>
        </div>
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
          <div className="metric-value">Rs {totalEarnings}</div>
        </div>
      </div>

      <div className="owner-grid">
        <div className="owner-column">
          <div className="owner-panel">
            <div className="owner-panel-title">Performance Snapshot</div>
            <div className="owner-panel-body">
              <div className="owner-kpi">
                <span>Paid Invoices</span>
                <strong>{paidInvoices.length}</strong>
              </div>
              <div className="owner-kpi">
                <span>Active Listings</span>
                <strong>{myListings.length}</strong>
              </div>
              <div className="owner-kpi">
                <span>Pending Requests</span>
                <strong>{pendingRequests.length}</strong>
              </div>
            </div>
          </div>

          <div className="owner-panel">
            <div className="owner-panel-title">Recent Requests</div>
            <div className="owner-panel-body">
              {pagedRequests.map((request) => (
                <div className="owner-list-item" key={request.id}>
                  <div>
                    <div className="owner-list-title">{request.equipmentName}</div>
                    <div className="owner-list-meta">
                      {request.startDate} to {request.endDate}
                    </div>
                  </div>
                  <span className="owner-pill">Requested</span>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="owner-empty">No pending requests right now.</div>
              )}
            </div>
            {pendingRequests.length > requestsPerPage && (
              <div className="owner-pagination">
                <div className="owner-page-info">
                  Page {requestPage} of {totalRequestPages}
                </div>
                <div className="owner-page-actions">
                  <button
                    type="button"
                    className="owner-page-btn"
                    onClick={() => setRequestPage((prev) => Math.max(prev - 1, 1))}
                    disabled={requestPage === 1}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="owner-page-btn"
                    onClick={() =>
                      setRequestPage((prev) => Math.min(prev + 1, totalRequestPages))
                    }
                    disabled={requestPage === totalRequestPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="owner-column">
          <div className="owner-panel">
            <div className="owner-panel-title">Notifications</div>
            <div className="owner-panel-body">
              {notifications.map((note) => (
                <div className="owner-list-item" key={note.label}>
                  <div className="owner-list-title">{note.label}</div>
                  <span className="owner-pill">{note.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="owner-panel">
            <div className="owner-panel-title">Locations</div>
            <div className="owner-panel-body">
              {Object.entries(locationCounts).slice(0, 5).map(([location, count]) => (
                <div className="owner-list-item" key={location}>
                  <div className="owner-list-title">{location}</div>
                  <span className="owner-pill">{count}</span>
                </div>
              ))}
              {Object.keys(locationCounts).length === 0 && (
                <div className="owner-empty">Add listings to see location data.</div>
              )}
            </div>
          </div>

          <div className="owner-panel">
            <div className="owner-panel-title">Messages</div>
            <div className="owner-panel-body">
              {ownerThreads.slice(0, 3).map((thread) => (
                <div className="owner-list-item" key={thread.id}>
                  <div>
                    <div className="owner-list-title">{thread.farmerName}</div>
                    <div className="owner-list-meta">{thread.equipmentName}</div>
                  </div>
                  {thread.unreadForOwner > 0 ? (
                    <span className="owner-pill alert">{thread.unreadForOwner}</span>
                  ) : (
                    <span className="owner-pill">Open</span>
                  )}
                </div>
              ))}
              {ownerThreads.length === 0 && (
                <div className="owner-empty">No messages yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
