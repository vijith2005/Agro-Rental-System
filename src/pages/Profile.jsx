import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import { changeMyPassword, getMyAuthUser, updateMyAuthUser } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import {
  ensureMyProfile,
  syncMyProfile,
  updateMyProfile as updateMyProfileDetails,
} from "../api/profileApi";
import "../styles/FarmerDashboard.css";
import "../styles/FarmerModules.css";
import {
  mapAuthUserToSessionUser,
  mergeProfileIntoUser,
  normalizeRole,
} from "../utils/auth";
import {
  getCurrentUser,
  hasPersistentSession,
  pushAuthHistory,
  saveSession,
  syncCurrentUser,
} from "../utils/session";

const buildProfileState = (user) => ({
  name: user?.name || "",
  email: user?.email || "",
  role: normalizeRole(user?.role),
  phone: user?.phone || "",
  state: user?.state || "",
  district: user?.district || "",
  farmSize: user?.farmSize || "",
  crops: user?.crops || "",
  address: user?.address || "",
  status: user?.status || "",
});

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
  const cachedUser = useMemo(() => getCurrentUser(), []);
  const [profile, setProfile] = useState(() => buildProfileState(cachedUser));
  const [message, setMessage] = useState({ variant: "", text: "" });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [activity, setActivity] = useState([]);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(cachedUser));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("authHistory")) || [];
      setActivity(history.slice().reverse().slice(0, 8));
    } catch {
      setActivity([]);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!cachedUser) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const authUser = await getMyAuthUser();
        const sessionUser = mapAuthUserToSessionUser(authUser);
        const remoteProfile = await ensureMyProfile(sessionUser);
        const mergedUser = mergeProfileIntoUser(sessionUser, remoteProfile);

        if (!isActive) {
          return;
        }

        syncCurrentUser(mergedUser);
        setProfile(buildProfileState(mergedUser));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMessage({
          variant: "warning",
          text: getApiErrorMessage(
            error,
            "Unable to load the latest profile details. Showing the saved session data instead."
          ),
        });
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [cachedUser]);

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
      setMessage({ variant: "", text: "" });
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (message.text) {
      setMessage({ variant: "", text: "" });
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      setMessage({ variant: "danger", text: "Name and email are required." });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(profile.email.trim())) {
      setMessage({ variant: "danger", text: "Please enter a valid email address." });
      return;
    }

    if (!/^[0-9]{10,15}$/.test(profile.phone.trim())) {
      setMessage({ variant: "danger", text: "Phone must contain 10 to 15 digits." });
      return;
    }

    setIsSavingProfile(true);
    setMessage({ variant: "", text: "" });

    try {
      const rememberMe = hasPersistentSession();
      const authResponse = await updateMyAuthUser({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      const authSessionUser = mapAuthUserToSessionUser(authResponse.user);

      saveSession(authSessionUser, authResponse.accessToken, rememberMe);

      let nextUser = authSessionUser;

      try {
        await syncMyProfile(authSessionUser);
        const updatedProfile = await updateMyProfileDetails({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          state: profile.state,
          district: profile.district,
          farmSize: profile.farmSize,
          crops: profile.crops,
        });

        nextUser = mergeProfileIntoUser(authSessionUser, updatedProfile);
        syncCurrentUser(nextUser);
        setMessage({ variant: "success", text: "Profile updated successfully." });
      } catch (profileError) {
        syncCurrentUser(authSessionUser);
        setMessage({
          variant: "warning",
          text: `Account details were updated, but profile details could not be fully synced. ${getApiErrorMessage(
            profileError,
            "Please try saving the profile again."
          )}`,
        });
      }

      setProfile(buildProfileState(nextUser));
      pushAuthHistory("PROFILE_UPDATED");
    } catch (error) {
      setMessage({
        variant: "danger",
        text: getApiErrorMessage(error, "Unable to update your profile right now."),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setMessage({ variant: "danger", text: "Fill in all password fields." });
      return;
    }

    setIsSavingPassword(true);
    setMessage({ variant: "", text: "" });

    try {
      await changeMyPassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
        confirmPassword: passwordForm.confirm,
      });

      setPasswordForm({ current: "", next: "", confirm: "" });
      setMessage({ variant: "success", text: "Password changed successfully." });
      pushAuthHistory("PASSWORD_CHANGED");
    } catch (error) {
      setMessage({
        variant: "danger",
        text: getApiErrorMessage(error, "Unable to change your password right now."),
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!cachedUser) {
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
              {profile.status ? (
                <Badge bg="secondary" className="text-uppercase px-3 py-2">
                  {profile.status}
                </Badge>
              ) : null}
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
              {isBootstrapping ? (
                <div className="text-muted small d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  Refreshing profile...
                </div>
              ) : null}
            </div>

            {message.text ? <Alert variant={message.variant || "info"}>{message.text}</Alert> : null}

            <Form onSubmit={handleSaveProfile}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
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
                      disabled={isSavingProfile}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      name="state"
                      value={profile.state}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>District</Form.Label>
                    <Form.Control
                      name="district"
                      value={profile.district}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{isFarmer ? "Farm Size (acres)" : "Address"}</Form.Label>
                    <Form.Control
                      name={isFarmer ? "farmSize" : "address"}
                      value={isFarmer ? profile.farmSize : profile.address}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
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
                        disabled={isSavingProfile}
                      />
                    </Form.Group>
                  </Col>
                ) : (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        name="address"
                        value={profile.address}
                        onChange={handleProfileChange}
                        disabled={isSavingProfile}
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>

              <Button type="submit" className="mt-4 agr-btn-primary" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
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
                  disabled={isSavingPassword}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="next"
                  value={passwordForm.next}
                  onChange={handlePasswordChange}
                  disabled={isSavingPassword}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirm"
                  value={passwordForm.confirm}
                  onChange={handlePasswordChange}
                  disabled={isSavingPassword}
                />
              </Form.Group>
              <Button type="submit" variant="outline-dark" disabled={isSavingPassword}>
                {isSavingPassword ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
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
                        <Badge bg="success">RECORDED</Badge>
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
