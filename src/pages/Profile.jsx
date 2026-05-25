import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Form, ListGroup, Modal, Row, Spinner } from "react-bootstrap";
import { changeMyPassword, getMyAuthUser, updateMyAuthUser } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { listRentalsByFarmer } from "../api/rentalApi";
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

const roleAccent = (role) => {
  if (role === "owner") return "warning";
  if (role === "delivery") return "info";
  if (role === "admin") return "danger";
  return "success";
};

const ACTIVITY_PAGE_SIZE = 3;

const Profile = () => {
  const cachedUser = useMemo(() => getCurrentUser(), []);
  const [profile, setProfile] = useState(() => buildProfileState(cachedUser));
  const [message, setMessage] = useState({ variant: "", text: "" });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [ongoingProducts, setOngoingProducts] = useState([]);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(cachedUser));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  useEffect(() => {
    setActivityPage((currentPage) => {
      const totalPages = Math.max(1, Math.ceil(activity.length / ACTIVITY_PAGE_SIZE));
      return Math.min(currentPage, totalPages);
    });
  }, [activity.length]);

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
  const activity = [];
  const activityPage = 1;
  const activityPageCount = 1;
  const activityPageDots = [];
  const activityStart = 0;
  const activityEnd = 0;
  const setActivityPage = () => {};

  useEffect(() => {
    let isActive = true;

    const loadOngoingProducts = async () => {
      if (!cachedUser?.email || profile.role !== "farmer") {
        if (isActive) setOngoingProducts([]);
        return;
      }

      try {
        const rentals = await listRentalsByFarmer(cachedUser.email);
        if (!isActive) return;

        const activeProducts = (Array.isArray(rentals) ? rentals : [])
          .filter(
            (rental) =>
              !["CANCELLED", "COMPLETED", "REFUNDED", "RETURNED"].includes(
                (rental.status || "").toUpperCase()
              )
          )
          .map((rental) => rental.equipmentName || "Product");

        setOngoingProducts(activeProducts);
      } catch {
        if (isActive) setOngoingProducts([]);
      }
    };

    loadOngoingProducts();

    return () => {
      isActive = false;
    };
  }, [cachedUser?.email, profile.role]);

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
      setShowPasswordModal(false);
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

  const openPasswordModal = () => {
    setMessage({ variant: "", text: "" });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ current: "", next: "", confirm: "" });
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
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <h5 className="mb-2">Security</h5>
                <p className="text-muted mb-0">Keep your account protected with a fresh password.</p>
              </div>
              <Button variant="outline-dark" onClick={openPasswordModal}>
                Change Password
              </Button>
            </div>
          </div>

          <div className="agr-panel profile-activity-panel">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
              <div className="profile-activity-header">
                <h5 className="mb-1">Ongoing Rented Products</h5>
                <p className="text-muted mb-0">Current products rented by this farmer.</p>
              </div>
              <Badge bg="secondary" className="px-3 py-2">
                {ongoingProducts.length} products
              </Badge>
            </div>
            <ListGroup variant="flush">
              {isFarmer && ongoingProducts.length > 0 ? (
                ongoingProducts.map((productName, index) => (
                  <ListGroup.Item key={`${productName}-${index}`} className="px-0">
                    {productName}
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="px-0 text-muted border-0">
                  {isFarmer ? "No ongoing rented products." : "This section is available for farmer accounts only."}
                </ListGroup.Item>
              )}
            </ListGroup>
            {activity.length > 0 ? (
              <div className="activity-pagination mt-4">
                <button
                  type="button"
                  className="activity-pagination-arrow"
                  onClick={() => setActivityPage((page) => Math.max(1, page - 1))}
                  disabled={activityPage === 1}
                  aria-label="Previous page"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <div className="activity-pagination-dots" aria-label="Activity pages">
                  {activityPageDots.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`activity-pagination-dot ${page === activityPage ? "active" : ""}`}
                      onClick={() => setActivityPage(page)}
                      aria-label={`Go to page ${page}`}
                      aria-current={page === activityPage ? "page" : undefined}
                    >
                      <span className="visually-hidden">Page {page}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="activity-pagination-arrow"
                  onClick={() => setActivityPage((page) => Math.min(activityPageCount, page + 1))}
                  disabled={activityPage === activityPageCount}
                  aria-label="Next page"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            ) : null}
            {activity.length > 0 ? (
              <div className="text-muted small mt-3">
                Showing {activityStart} to {activityEnd} of {activity.length} entries
              </div>
            ) : null}
          </div>
        </Col>
      </Row>

      <Modal show={showPasswordModal} onHide={closePasswordModal} centered>
        <Form onSubmit={handleChangePassword}>
          <Modal.Header closeButton>
            <Modal.Title>Change Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {message.text ? <Alert variant={message.variant || "info"}>{message.text}</Alert> : null}
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
            <Form.Group className="mb-0">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirm"
                value={passwordForm.confirm}
                onChange={handlePasswordChange}
                disabled={isSavingPassword}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closePasswordModal} disabled={isSavingPassword}>
              Cancel
            </Button>
            <Button type="submit" variant="dark" disabled={isSavingPassword}>
              {isSavingPassword ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
