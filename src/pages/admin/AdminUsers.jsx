import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
import PaginationControls from "../../components/PaginationControls";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { listUsers } from "../../api/authApi";
import { listProfiles } from "../../api/profileApi";

const PAGE_SIZE = 100;
const VIEW_PAGE_SIZE = 8;

const normalizeStatus = (value) => (value || "").toString().trim().toUpperCase();

const humanize = (value) =>
  (value || "Unknown")
    .toString()
    .trim()
    .toLowerCase()
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const fetchAllProfiles = async () => {
  const profiles = [];
  let page = 0;

  while (true) {
    const response = await listProfiles({ page, size: PAGE_SIZE });
    const content = Array.isArray(response?.content) ? response.content : [];
    profiles.push(...content);

    const totalPages = Number(response?.totalPages || 0);
    if ((totalPages > 0 && page + 1 >= totalPages) || content.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return profiles;
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const [usersData, profilesData] = await Promise.all([listUsers(), fetchAllProfiles()]);
        if (!active) return;
        setUsers(Array.isArray(usersData) ? usersData : []);
        setProfiles(Array.isArray(profilesData) ? profilesData : []);
      } catch {
        if (active) {
          setLoadError("Unable to load the latest admin user data from the backend.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const profilesByAuthId = useMemo(() => {
    const map = new Map();
    profiles.forEach((profile) => {
      if (profile?.authUserId !== undefined && profile?.authUserId !== null) {
        map.set(String(profile.authUserId), profile);
      }
    });
    return map;
  }, [profiles]);

  const mappedUsers = useMemo(
    () =>
      users.map((user) => {
        const profile = profilesByAuthId.get(String(user.id));
        return {
          id: user.id,
          name: user.name || "Unknown",
          email: user.email || "Unknown",
          phone: user.phone || "N/A",
          role: humanize(user.role),
          status: humanize(profile?.status || "ACTIVE"),
        };
      }),
    [profilesByAuthId, users]
  );

  const totalPages = Math.max(1, Math.ceil(mappedUsers.length / VIEW_PAGE_SIZE));
  const pageItems = mappedUsers.slice((page - 1) * VIEW_PAGE_SIZE, page * VIEW_PAGE_SIZE);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const statusVariant = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ACTIVE") return "success";
    if (normalized === "BLOCKED") return "danger";
    return "warning";
  };

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="page-header">
        <div>
          <div className="page-title">User Directory</div>
          <div className="page-subtitle">Manage roles, verification, and status using live backend records.</div>
        </div>
      </div>

      {loadError && <div className="alert alert-warning mb-3">{loadError}</div>}
      {loading && <div className="alert alert-info mb-3">Loading users from the backend...</div>}

      <div className="list-shell">
        <div className="list-grid">
          {mappedUsers.length === 0 && !loading && (
            <div className="text-muted py-4">No users were returned by the backend.</div>
          )}
          {pageItems.map((user) => (
            <div key={user.id} className="list-card">
              <div>
                <div className="equipment-name">{user.name}</div>
                <div className="list-meta">
                  {user.email} - {user.role}
                </div>
                <div className="list-meta">{user.phone}</div>
              </div>
              <Badge bg={statusVariant(user.status)}>{user.status}</Badge>
            </div>
          ))}
        </div>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={mappedUsers.length}
          pageSize={VIEW_PAGE_SIZE}
          itemLabel="users"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
