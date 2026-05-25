import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AnalyticsChart from "../../components/AnalyticsChart";
import PaginationControls from "../../components/PaginationControls";
import { listUsers } from "../../api/authApi";
import { listProfiles } from "../../api/profileApi";
import { listEquipment } from "../../api/equipmentApi";
import { assignReturnPickup, listAllRentals, scheduleRental, sendRentalMessage } from "../../api/rentalApi";
import { listAllPayments } from "../../api/paymentApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { formatBookingRange } from "../../utils/bookingDates";
import "../../styles/FarmerDashboard.css";

const PAGE_SIZE = 100;
const ACTIVE_RENTAL_STATUSES = new Set([
  "APPROVED",
  "SCHEDULED",
  "IN_TRANSIT",
  "DELIVERED",
  "IN_USE",
  "RETURN_SCHEDULED",
]);
const LIST_PAGE_SIZE = 5;

const currencyFormatter = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const numberFormatter = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const humanize = (value) => {
  const text = (value || "").toString().trim();
  if (!text) return "Unknown";

  return text
    .toLowerCase()
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeStatus = (value) => (value || "").toString().trim().toUpperCase();
const normalizeValue = (value) => (value || "").toString().trim().toLowerCase();

const formatRentalDateLabel = (rental) => formatBookingRange(rental?.startDate, rental?.endDate);

const getMonthKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const createLastMonths = (count = 6) => {
  const months = [];
  const current = new Date();
  current.setDate(1);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(current);
    date.setMonth(current.getMonth() - offset);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
    });
  }

  return months;
};

const countBy = (items, keySelector, limit = 5, labelFormatter = humanize) => {
  const counts = new Map();

  items.forEach((item) => {
    const rawValue = keySelector(item);
    const normalizedKey = rawValue ? rawValue.toString().trim().toUpperCase() : "UNKNOWN";
    counts.set(normalizedKey, (counts.get(normalizedKey) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([key, value]) => ({
      label: labelFormatter(key),
      value,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
};

const fetchAllPages = async (loader) => {
  const collected = [];
  let page = 0;

  while (true) {
    const response = await loader(page, PAGE_SIZE);
    const content = Array.isArray(response?.content) ? response.content : [];
    collected.push(...content);

    const totalPages = Number(response?.totalPages || 0);
    if ((totalPages > 0 && page + 1 >= totalPages) || content.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return collected;
};

const Admin = () => {
  const [data, setData] = useState({
    users: [],
    profiles: [],
    equipment: [],
    rentals: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [recentRentalPage, setRecentRentalPage] = useState(1);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [returnAssignmentPage, setReturnAssignmentPage] = useState(1);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [returnAssignmentDrafts, setReturnAssignmentDrafts] = useState({});
  const [assigningRentalId, setAssigningRentalId] = useState("");
  const [assigningReturnRentalId, setAssigningReturnRentalId] = useState("");

  useEffect(() => {
    let active = true;
    const failedSources = [];
    const cachedRentals = getStored(STORAGE_KEYS.rentals, []);
    const cachedPayments = getStored(STORAGE_KEYS.payments, []);

    const safeLoad = async (label, loader, fallback = [], trackFailure = true) => {
      try {
        return await loader();
      } catch {
        if (trackFailure) {
          failedSources.push(label);
        }
        return fallback;
      }
    };

    const loadDashboard = async () => {
      setLoading(true);
      setLoadError("");

      const [users, profiles, equipment, rentals, payments] = await Promise.all([
        safeLoad("users", () => listUsers(), []),
        safeLoad("profiles", () => fetchAllPages((page, size) => listProfiles({ page, size })), []),
        safeLoad("equipment", () => fetchAllPages((page, size) => listEquipment({ page, size })), []),
        safeLoad("rentals", () => listAllRentals(), cachedRentals, false),
        safeLoad("payments", () => listAllPayments(), cachedPayments, false),
      ]);

      if (!active) {
        return;
      }

      if (failedSources.length > 0) {
        setLoadError(`Some admin data could not be loaded from the backend: ${failedSources.join(", ")}.`);
      }

      setData({
        users: Array.isArray(users) ? users : [],
        profiles: Array.isArray(profiles) ? profiles : [],
        equipment: Array.isArray(equipment) ? equipment : [],
        rentals: Array.isArray(rentals) ? rentals : [],
        payments: Array.isArray(payments) ? payments : [],
      });
      setLastUpdated(new Date());
      setLoading(false);
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshTick]);

  const summary = useMemo(() => {
    const activeProfiles = data.profiles.filter(
      (profile) => normalizeStatus(profile.status) === "ACTIVE"
    ).length;

    const availableEquipment = data.equipment.filter(
      (item) => item.available || normalizeStatus(item.status) === "AVAILABLE"
    ).length;

    const activeRentals = data.rentals.filter((item) =>
      ACTIVE_RENTAL_STATUSES.has(normalizeStatus(item.status))
    ).length;
    const totalRevenue = data.payments
      .filter((payment) => normalizeStatus(payment.status) === "PAID")
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    const currentMonthKey = getMonthKey(new Date());
    const monthRevenue = data.payments
      .filter(
        (payment) =>
          normalizeStatus(payment.status) === "PAID" &&
          getMonthKey(payment.paidAt || payment.updatedAt || payment.createdAt || payment.initiatedAt) ===
            currentMonthKey
      )
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    return {
      registeredUsers: data.users.length,
      activeProfiles,
      totalEquipment: data.equipment.length,
      availableEquipment,
      activeRentals,
      totalRevenue,
      monthRevenue,
    };
  }, [data.equipment, data.payments, data.profiles, data.rentals, data.users]);

  const equipmentChart = useMemo(
    () => countBy(data.equipment, (item) => item.category, 5, humanize),
    [data.equipment]
  );

  const deliveryAgents = useMemo(
    () =>
      data.users.filter((user) => {
        const role = normalizeStatus(user.role);
        return role === "AGENT" || role === "DELIVERY";
      }),
    [data.users]
  );

  const rentalChart = useMemo(
    () => countBy(data.rentals, (item) => item.status, 6, humanize),
    [data.rentals]
  );

  const userRoleChart = useMemo(
    () => countBy(data.users, (item) => item.role, 4, humanize),
    [data.users]
  );

  const paymentChart = useMemo(() => {
    const months = createLastMonths(6);
    const valuesByMonth = new Map(months.map((month) => [month.key, 0]));

    data.payments
      .filter((payment) => normalizeStatus(payment.status) === "PAID")
      .forEach((payment) => {
        const monthKey = getMonthKey(
          payment.paidAt || payment.updatedAt || payment.createdAt || payment.initiatedAt
        );
        if (valuesByMonth.has(monthKey)) {
          valuesByMonth.set(monthKey, valuesByMonth.get(monthKey) + (Number(payment.amount) || 0));
        }
      });

    return months.map((month) => ({
      label: month.label,
      value: valuesByMonth.get(month.key) || 0,
    }));
  }, [data.payments]);

  const recentRentals = useMemo(
    () =>
      [...data.rentals].sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt || 0).getTime() -
          new Date(left.updatedAt || left.createdAt || 0).getTime()
      ),
    [data.rentals]
  );
  const assignableRentals = useMemo(
    () =>
      [...data.rentals]
        .filter((rental) =>
          ["REQUESTED", "APPROVED", "SCHEDULED", "IN_TRANSIT"].includes(
            normalizeStatus(rental.status)
          )
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt || right.createdAt || 0).getTime() -
            new Date(left.updatedAt || left.createdAt || 0).getTime()
        ),
    [data.rentals]
  );
  const returnAssignableRentals = useMemo(
    () =>
      [...data.rentals]
        .filter((rental) =>
          ["DELIVERED", "IN_USE", "RETURN_SCHEDULED"].includes(normalizeStatus(rental.status))
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt || right.createdAt || 0).getTime() -
            new Date(left.updatedAt || left.createdAt || 0).getTime()
        ),
    [data.rentals]
  );
  const recentRentalTotalPages = Math.max(1, Math.ceil(recentRentals.length / LIST_PAGE_SIZE));
  const assignmentTotalPages = Math.max(1, Math.ceil(assignableRentals.length / LIST_PAGE_SIZE));
  const returnAssignmentTotalPages = Math.max(1, Math.ceil(returnAssignableRentals.length / LIST_PAGE_SIZE));
  const recentRentalPageItems = recentRentals.slice(
    (recentRentalPage - 1) * LIST_PAGE_SIZE,
    recentRentalPage * LIST_PAGE_SIZE
  );
  const assignmentPageItems = assignableRentals.slice(
    (assignmentPage - 1) * LIST_PAGE_SIZE,
    assignmentPage * LIST_PAGE_SIZE
  );
  const returnAssignmentPageItems = returnAssignableRentals.slice(
    (returnAssignmentPage - 1) * LIST_PAGE_SIZE,
    returnAssignmentPage * LIST_PAGE_SIZE
  );

  useEffect(() => {
    setRecentRentalPage((currentPage) => Math.min(currentPage, recentRentalTotalPages));
  }, [recentRentalTotalPages]);

  useEffect(() => {
    setAssignmentPage((currentPage) => Math.min(currentPage, assignmentTotalPages));
  }, [assignmentTotalPages]);

  useEffect(() => {
    setAssignmentDrafts((currentDrafts) => {
      const next = { ...currentDrafts };
      data.rentals.forEach((rental) => {
        if (!(rental.id in next)) {
          next[rental.id] = rental.agentId || "";
        }
      });
      return next;
    });
  }, [data.rentals]);

  useEffect(() => {
    setReturnAssignmentPage((currentPage) => Math.min(currentPage, returnAssignmentTotalPages));
  }, [returnAssignmentTotalPages]);

  useEffect(() => {
    setReturnAssignmentDrafts((currentDrafts) => {
      const next = { ...currentDrafts };
      data.rentals.forEach((rental) => {
        if (!(rental.id in next)) {
          next[rental.id] = rental.returnAgentId || rental.agentId || "";
        }
      });
      return next;
    });
  }, [data.rentals]);

  const refreshDashboard = () => setRefreshTick((value) => value + 1);

  const assignDeliveryAgent = async (rental) => {
    const selectedAgentEmail = (assignmentDrafts[rental.id] || rental.agentId || "").trim();
    const selectedAgent = deliveryAgents.find(
      (user) => (user.email || "").toLowerCase() === selectedAgentEmail.toLowerCase()
    );

    if (!selectedAgent) {
      toast.error("Choose a delivery agent first.");
      return;
    }

    setAssigningRentalId(rental.id);
    const agentName = selectedAgent.name || selectedAgent.email;

    const buildFallbackRental = () => ({
      ...rental,
      agentId: selectedAgent.email,
      agentName,
      schedule: {
        ...(rental.schedule || {}),
        agentId: selectedAgent.email,
        agentName,
        deliveryLocation: rental.deliveryLocation || rental.schedule?.deliveryLocation || "",
      },
    });

    try {
      const updated = await scheduleRental(rental.id, {
        agentId: selectedAgent.email,
        agentName,
        deliveryLocation: rental.deliveryLocation || rental.schedule?.deliveryLocation || "",
        routeNote: "Assigned by admin",
      });

      try {
        await sendRentalMessage({
          rentalId: rental.id,
          text: `Admin assigned ${agentName} to handle this order.`,
        });
      } catch {
        // Best-effort notification only.
      }

      setData((current) => ({
        ...current,
        rentals: current.rentals.map((item) => (item.id === rental.id ? updated : item)),
      }));
      setStored(STORAGE_KEYS.rentals, data.rentals.map((item) => (item.id === rental.id ? updated : item)));
      setLastUpdated(new Date());
      toast.success(`Assigned to ${agentName}.`);
    } catch {
      const fallback = buildFallbackRental();
      setData((current) => ({
        ...current,
        rentals: current.rentals.map((item) => (item.id === rental.id ? fallback : item)),
      }));
      setStored(STORAGE_KEYS.rentals, data.rentals.map((item) => (item.id === rental.id ? fallback : item)));
      setLastUpdated(new Date());
      toast("Assigned locally because the backend was unavailable.");
    } finally {
      setAssigningRentalId("");
    }
  };

  const assignReturnPickupAgent = async (rental) => {
    const selectedAgentEmail = (returnAssignmentDrafts[rental.id] || rental.returnAgentId || rental.agentId || "").trim();
    const selectedAgent = deliveryAgents.find(
      (user) => (user.email || "").toLowerCase() === selectedAgentEmail.toLowerCase()
    );

    if (!selectedAgent) {
      toast.error("Choose a return pickup agent first.");
      return;
    }

    setAssigningReturnRentalId(rental.id);
    const agentName = selectedAgent.name || selectedAgent.email;

    const buildFallbackRental = () => ({
      ...rental,
      returnAgentId: selectedAgent.email,
      returnAgentName: agentName,
    });

    try {
      const updated = await assignReturnPickup(rental.id, {
        agentId: selectedAgent.email,
        agentName,
        routeNote: "Return pickup assigned by admin",
      });

      try {
        await sendRentalMessage({
          rentalId: rental.id,
          text: `Admin assigned ${agentName} for the return pickup of this order.`,
        });
      } catch {
        // Best-effort notification only.
      }

      setData((current) => ({
        ...current,
        rentals: current.rentals.map((item) => (item.id === rental.id ? updated : item)),
      }));
      setStored(STORAGE_KEYS.rentals, data.rentals.map((item) => (item.id === rental.id ? updated : item)));
      setLastUpdated(new Date());
      toast.success(`Return pickup assigned to ${agentName}.`);
    } catch {
      const fallback = buildFallbackRental();
      setData((current) => ({
        ...current,
        rentals: current.rentals.map((item) => (item.id === rental.id ? fallback : item)),
      }));
      setStored(STORAGE_KEYS.rentals, data.rentals.map((item) => (item.id === rental.id ? fallback : item)));
      setLastUpdated(new Date());
      toast("Return pickup assigned locally because the backend was unavailable.");
    } finally {
      setAssigningReturnRentalId("");
    }
  };

  const getRentalBadge = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "PAID" || normalized === "COMPLETED") return "success";
    if (normalized === "CANCELLED" || normalized === "REJECTED") return "danger";
    if (normalized === "IN_TRANSIT" || normalized === "DELIVERED") return "info";
    if (normalized === "DAMAGED") return "warning";
    return "primary";
  };

  const getDeliveryAssignmentLabel = (rental) => {
    const selectedAgentId = normalizeValue(assignmentDrafts[rental.id] || rental.agentId);
    const currentAgentId = normalizeValue(rental.agentId);

    if (!selectedAgentId) {
      return "Assign";
    }
    if (selectedAgentId === currentAgentId && currentAgentId) {
      return "Assigned";
    }
    return currentAgentId ? "Reassign" : "Assign";
  };

  const getReturnAssignmentLabel = (rental) => {
    const selectedAgentId = normalizeValue(returnAssignmentDrafts[rental.id] || rental.returnAgentId || rental.agentId);
    const currentAgentId = normalizeValue(rental.returnAgentId || rental.agentId);

    if (!selectedAgentId) {
      return "Assign Return";
    }
    if (selectedAgentId === currentAgentId && currentAgentId) {
      return "Assigned";
    }
    return currentAgentId ? "Reassign Return" : "Assign Return";
  };

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="admin-title">Admin Command Center</div>
      <div className="admin-subtitle">
        Monitor platform performance and validate equipment listings with live backend data.
      </div>

      <div className="dashboard-banner">
        <div>
          <p className="banner-title mb-1">Platform snapshot</p>
          <div className="banner-meta">
            {loading
              ? "Refreshing live data from the backend..."
              : `Last synced ${lastUpdated ? lastUpdated.toLocaleString("en-IN") : "just now"}`}
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Link to="/admin/users" className="btn btn-outline-success btn-sm">
            Users
          </Link>
          <Link to="/admin/equipment" className="btn btn-outline-success btn-sm">
            Equipment
          </Link>
          <Button variant="success" size="sm" onClick={refreshDashboard} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {loadError && <div className="alert alert-warning mt-3 mb-0">{loadError}</div>}

      <Row className="g-3 mt-2">
        <Col md={6} lg={3}>
          <Card className="admin-card shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Registered Users</div>
              <div className="fs-3 fw-bold mt-2">{numberFormatter(summary.registeredUsers)}</div>
              <div className="text-success small">{numberFormatter(summary.activeProfiles)} active profiles</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="admin-card shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Equipment Listings</div>
              <div className="fs-3 fw-bold mt-2">{numberFormatter(summary.totalEquipment)}</div>
              <div className="text-success small">{numberFormatter(summary.availableEquipment)} available now</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="admin-card shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Active Rentals</div>
              <div className="fs-3 fw-bold mt-2">{numberFormatter(summary.activeRentals)}</div>
              <div className="text-info small">Live backend rental flow</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="admin-card shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Revenue</div>
              <div className="fs-3 fw-bold mt-2">{currencyFormatter(summary.totalRevenue)}</div>
              <div className="text-success small">This month: {currencyFormatter(summary.monthRevenue)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={6}>
          <AnalyticsChart
            title="Equipment by Category"
            subtitle="Shows how the inventory is distributed across equipment types."
            data={equipmentChart}
          />
        </Col>
        <Col lg={6}>
          <AnalyticsChart
            title="Rental Status Mix"
            subtitle="Tracks the live flow of bookings through the rental pipeline."
            data={rentalChart}
          />
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={6}>
          <AnalyticsChart
            title="Users by Role"
            subtitle="Breakdown of the current user base across the platform."
            data={userRoleChart}
          />
        </Col>
        <Col lg={6}>
          <AnalyticsChart
            title="Paid Revenue by Month"
            subtitle="Aggregated paid payments for the last six months."
            data={paymentChart}
            formatValue={currencyFormatter}
            emptyMessage="No paid payments are available yet."
          />
        </Col>
      </Row>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <Card.Title className="h6 mb-1">Assign Delivery Agents</Card.Title>
              <div className="text-muted small">
                Assign an order to a delivery agent so the agent dashboard can pick it up and trigger the return reminder.
              </div>
            </div>
            <span className="badge bg-success">{deliveryAgents.length} agents available</span>
          </div>

          {deliveryAgents.length === 0 ? (
            <div className="alert alert-warning mt-3 mb-0">
              No delivery agents are available yet. Register at least one user with the delivery role.
            </div>
          ) : (
            <Table responsive className="admin-table mt-3 mb-0">
              <thead>
                <tr>
                  <th>Booking Date</th>
                  <th>Farmer</th>
                  <th>Current Agent</th>
                  <th>Assign Agent</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignmentPageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No rentals are ready for assignment.
                    </td>
                  </tr>
                )}
                {assignmentPageItems.map((rental) => (
                  <tr key={rental.id}>
                    <td>
                      <div className="fw-semibold">{rental.equipmentName || "Equipment"}</div>
                      <div className="text-muted small">{formatRentalDateLabel(rental)}</div>
                    </td>
                    <td>{rental.farmerName || rental.farmerId || "Unknown"}</td>
                    <td>{rental.agentName || rental.agentId || "Unassigned"}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={assignmentDrafts[rental.id] || rental.agentId || ""}
                        onChange={(event) =>
                          setAssignmentDrafts((current) => ({
                            ...current,
                            [rental.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select agent</option>
                        {deliveryAgents.map((agent) => (
                          <option key={agent.email} value={agent.email}>
                            {agent.name || agent.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning"
                        onClick={() => assignDeliveryAgent(rental)}
                        disabled={assigningRentalId === rental.id}
                      >
                        {assigningRentalId === rental.id ? "Assigning..." : getDeliveryAssignmentLabel(rental)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <PaginationControls
            currentPage={assignmentPage}
            totalPages={assignmentTotalPages}
            totalItems={assignableRentals.length}
            pageSize={LIST_PAGE_SIZE}
            itemLabel="assignments"
            onPageChange={setAssignmentPage}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <Card.Title className="h6 mb-1">Assign Return Pickup Agents</Card.Title>
              <div className="text-muted small">
                Assign the delivery agent who will collect the equipment back from the farmer and return it to the owner.
              </div>
            </div>
            <span className="badge bg-warning text-dark">{returnAssignableRentals.length} return tasks</span>
          </div>

          {deliveryAgents.length === 0 ? (
            <div className="alert alert-warning mt-3 mb-0">
              No delivery agents are available yet. Register at least one user with the delivery role.
            </div>
          ) : (
            <Table responsive className="admin-table mt-3 mb-0">
              <thead>
                <tr>
                  <th>Booking Date</th>
                  <th>Farmer</th>
                  <th>Current Return Agent</th>
                  <th>Assign Agent</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {returnAssignmentPageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No return pickups are ready for assignment.
                    </td>
                  </tr>
                )}
                {returnAssignmentPageItems.map((rental) => (
                  <tr key={rental.id}>
                    <td>
                      <div className="fw-semibold">{rental.equipmentName || "Equipment"}</div>
                      <div className="text-muted small">{formatRentalDateLabel(rental)}</div>
                    </td>
                    <td>{rental.farmerName || rental.farmerId || "Unknown"}</td>
                    <td>{rental.returnAgentName || rental.returnAgentId || rental.agentName || rental.agentId || "Unassigned"}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={returnAssignmentDrafts[rental.id] || rental.returnAgentId || rental.agentId || ""}
                        onChange={(event) =>
                          setReturnAssignmentDrafts((current) => ({
                            ...current,
                            [rental.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select agent</option>
                        {deliveryAgents.map((agent) => (
                          <option key={agent.email} value={agent.email}>
                            {agent.name || agent.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning"
                        onClick={() => assignReturnPickupAgent(rental)}
                        disabled={assigningReturnRentalId === rental.id}
                      >
                        {assigningReturnRentalId === rental.id ? "Assigning..." : getReturnAssignmentLabel(rental)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <PaginationControls
            currentPage={returnAssignmentPage}
            totalPages={returnAssignmentTotalPages}
            totalItems={returnAssignableRentals.length}
            pageSize={LIST_PAGE_SIZE}
            itemLabel="return assignments"
            onPageChange={setReturnAssignmentPage}
          />
        </Card.Body>
      </Card>

      <Row className="g-3 mt-1">
        <Col lg={12}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <Card.Title className="h6 mb-1">Recent Rentals</Card.Title>
                  <div className="text-muted small">Latest rental updates pulled directly from the rental service.</div>
                </div>
                <Link to="/admin/equipment" className="btn btn-outline-success btn-sm">
                  View Inventory
                </Link>
              </div>

              <Table responsive className="admin-table mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Farmer</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
              <tbody>
                  {recentRentalPageItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No rental records were returned by the backend.
                      </td>
                    </tr>
                  )}
                  {recentRentalPageItems.map((rental) => (
                    <tr key={rental.id}>
                      <td>
                        <div className="fw-semibold">{rental.equipmentName || "Unknown equipment"}</div>
                        <div className="text-muted small">{formatRentalDateLabel(rental)}</div>
                      </td>
                      <td>{rental.farmerName || rental.farmerId || "Unknown"}</td>
                      <td>
                        <Badge bg={getRentalBadge(rental.status)}>{humanize(rental.status)}</Badge>
                      </td>
                      <td className="text-muted small">
                        {rental.updatedAt ? new Date(rental.updatedAt).toLocaleDateString("en-IN") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationControls
                currentPage={recentRentalPage}
                totalPages={recentRentalTotalPages}
                totalItems={recentRentals.length}
                pageSize={LIST_PAGE_SIZE}
                itemLabel="rentals"
                onPageChange={setRecentRentalPage}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Admin;
