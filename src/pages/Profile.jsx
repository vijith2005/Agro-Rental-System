import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Form, Row, Table } from "react-bootstrap";
import "../styles/FarmerDashboard.css";
import "../styles/FarmerModules.css";
import { normalizeRole } from "../utils/auth";
import {
  authApi,
  authErrorMessage,
  normalizeAuthUser,
  readStoredToken,
  readStoredUser,
  storeAuthSession,
} from "../utils/authApi";

const getCurrentUser = () => readStoredUser();

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("users")) || [];
  } catch {
    return [];
  }
};

const persistCurrentUser = (user) => {
  const rememberMe = Boolean(localStorage.getItem("agro_token"));
  const token = readStoredToken();
  storeAuthSession(user, token, rememberMe);
};

const updateUsersCollection = (nextUser, previousEmail) => {
  const users = getUsers();
  const index = users.findIndex(
    (item) => item.email?.toLowerCase() === previousEmail?.toLowerCase()
  );

  if (index >= 0) {
    users[index] = { ...users[index], ...nextUser };
  } else {
    users.push(nextUser);
  }

  localStorage.setItem("users", JSON.stringify(users));
};

const activityLabel = (item) => item.type || item.action || "LOGIN";

const activityTime = (item) => {
  const value = item.at || item.createdAt || item.time;
  if (!value) return "--";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const roleAccent = (role) => {
  if (role === "owner") return "warning";
  if (role === "delivery") return "info";
  if (role === "admin") return "danger";
  return "success";
};

const Profile = () => {
  const baseUser = useMemo(() => getCurrentUser(), []);
  const [sourceEmail, setSourceEmail] = useState(baseUser?.email || "");
  const [profile, setProfile] = useState({
    name: baseUser?.name || "",
    email: baseUser?.email || "",
    role: normalizeRole(baseUser?.role),
    phone: baseUser?.phone || "",
    state: baseUser?.state || "",
    district: baseUser?.district || "",
    farmSize: baseUser?.farmSize || "",
    crops: baseUser?.crops || "",
    address: baseUser?.address || "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("authHistory")) || [];
      setActivity(history.slice().reverse().slice(0, 8));
    } catch {
      setActivity([]);
    }
  }, []);

  const initials = useMemo(() => {
    const seed = profile.name || profile.email || "AG";
    return seed
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile.email, profile.name]);

  const isFarmer = profile.role === "farmer";

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      setMessage({ type: "danger", text: "Name and email are required." });
      return;
    }

    const token = readStoredToken();
    if (!token) {
      setMessage({ type: "danger", text: "Your session expired. Please log in again." });
      return;
    }

    const payload = {
      name: profile.name.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone.trim(),
    };

    authApi
      .put("/users/me", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const normalizedUser = normalizeAuthUser(response.data?.user);
        const nextUser = {
          ...baseUser,
          ...profile,
          ...normalizedUser,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: normalizeRole(normalizedUser?.role || profile.role),
          state: profile.state.trim(),
          district: profile.district.trim(),
          farmSize: profile.farmSize,
          crops: profile.crops.trim(),
          address: profile.address.trim(),
        };

        persistCurrentUser(nextUser);
        updateUsersCollection(nextUser, sourceEmail);
        setSourceEmail(nextUser.email);
        setProfile((prev) => ({
          ...prev,
          name: nextUser.name,
          email: nextUser.email,
          phone: nextUser.phone,
          role: nextUser.role,
        }));

        const newToken = response.data?.accessToken;
        if (newToken) {
          const rememberMe = Boolean(localStorage.getItem("agro_token"));
          storeAuthSession(nextUser, newToken, rememberMe);
        }

        setMessage({ type: "success", text: "Profile updated successfully." });
      })
      .catch((error) => {
        setMessage({ type: "danger", text: authErrorMessage(error, "Unable to update profile") });
      });
  };

  const handleChangePassword = (event) => {
    event.preventDefault();

    const token = readStoredToken();
    if (!token) {
      setMessage({ type: "danger", text: "Your session expired. Please log in again." });
      return;
    }

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setMessage({ type: "danger", text: "Fill in all password fields." });
      return;
    }
    if (passwordForm.next.length < 6) {
      setMessage({ type: "danger", text: "New password must be at least 6 characters." });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setMessage({ type: "danger", text: "New password and confirm password do not match." });
      return;
    }

    authApi
      .put(
        "/users/me/password",
        {
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
          confirmPassword: passwordForm.confirm,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        const currentUser =
          readStoredUser() ||
          baseUser || {
            email: sourceEmail,
          };
        const nextUser = {
          ...currentUser,
          ...profile,
          name: profile.name.trim(),
          email: profile.email.trim().toLowerCase(),
          phone: profile.phone.trim(),
          role: normalizeRole(profile.role),
          state: profile.state.trim(),
          district: profile.district.trim(),
          farmSize: profile.farmSize,
          crops: profile.crops.trim(),
          address: profile.address.trim(),
        };

        persistCurrentUser(nextUser);
        updateUsersCollection(nextUser, sourceEmail);
        setPasswordForm({ current: "", next: "", confirm: "" });
        setMessage({ type: "success", text: "Password changed successfully." });
      })
      .catch((error) => {
        setMessage({ type: "danger", text: authErrorMessage(error, "Unable to change password") });
      });
  };

  if (!baseUser) {
    return (
      <div className="agr-page profile-page">
        <div className="agr-panel">
          <Alert variant="warning" className="mb-0">
            No active user session was found. Please log in again.
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="agr-page profile-page">
      <div className="agr-panel mb-4">
        <div className="d-flex flex-wrap align-items-center gap-4">
          <div
            className="d-flex align-items-center justify-content-center rounded-4 text-white fw-bold"
            style={{
              width: "74px",
              height: "74px",
              background: "linear-gradient(135deg, #2f6b2f, #184d2f)",
              fontSize: "1.9rem",
            }}
          >
            {initials || "AG"}
          </div>
          <div>
            <h1 className="agr-h1 mb-2">{profile.name || "AgroConnect User"}</h1>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Badge bg={roleAccent(profile.role)} className="text-uppercase px-3 py-2">
                {profile.role}
              </Badge>
              <span className="text-muted">{profile.email}</span>
            </div>
          </div>
        </div>
      </div>

      <Row className="g-4">
        <Col xl={8}>
          <div className="agr-panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Profile Information</h5>
            </div>

            {message.text ? (
              <Alert variant={message.type === "success" ? "success" : "danger"}>{message.text}</Alert>
            ) : null}

            <Form onSubmit={handleSaveProfile}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control name="name" value={profile.name} onChange={handleProfileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control name="phone" value={profile.phone} onChange={handleProfileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>State</Form.Label>
                    <Form.Control name="state" value={profile.state} onChange={handleProfileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>District</Form.Label>
                    <Form.Control name="district" value={profile.district} onChange={handleProfileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{isFarmer ? "Farm Size (acres)" : "Address"}</Form.Label>
                    <Form.Control
                      name={isFarmer ? "farmSize" : "address"}
                      value={isFarmer ? profile.farmSize : profile.address}
                      onChange={handleProfileChange}
                    />
                  </Form.Group>
                </Col>
                {isFarmer ? (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Crop Types</Form.Label>
                      <Form.Control
                        name="crops"
                        value={profile.crops}
                        onChange={handleProfileChange}
                        placeholder="e.g., Paddy, Maize"
                      />
                    </Form.Group>
                  </Col>
                ) : null}
              </Row>

              <Button type="submit" className="mt-4 agr-btn-primary">
                Save Changes
              </Button>
            </Form>
          </div>
        </Col>

        <Col xl={4}>
          <div className="agr-panel mb-4">
            <h5 className="mb-4">Security</h5>
            <Form onSubmit={handleChangePassword}>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  name="current"
                  value={passwordForm.current}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="next"
                  value={passwordForm.next}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirm"
                  value={passwordForm.confirm}
                  onChange={handlePasswordChange}
                />
              </Form.Group>
              <Button type="submit" variant="outline-dark">
                Update Password
              </Button>
            </Form>
          </div>

          <div className="agr-panel">
            <h5 className="mb-4">Activity Log</h5>
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.length > 0 ? (
                  activity.map((item, index) => (
                    <tr key={`${item.at || item.time || index}-${index}`}>
                      <td>{activityLabel(item)}</td>
                      <td>{activityTime(item)}</td>
                      <td>
                        <Badge bg="success">LOGIN</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-muted">
                      No recent activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
