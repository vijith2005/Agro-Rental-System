import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import bgImage from "../assets/hero.jpg";
import SiteFooter from "../components/SiteFooter";
import {
  mapAuthUserToSessionUser,
  mergeProfileIntoUser,
  routeByRole,
} from "../utils/auth";
import { registerUser } from "../api/authApi";
import { ensureMyProfile, syncMyProfile } from "../api/profileApi";
import { pushAuthHistory, saveSession, syncCurrentUser } from "../utils/session";

const Tractor = () => <i className="bi bi-tractor fs-1"></i>;
const Mail = () => <i className="bi bi-envelope"></i>;
const Lock = () => <i className="bi bi-lock"></i>;
const User = () => <i className="bi bi-person"></i>;
const Phone = () => <i className="bi bi-telephone"></i>;
const Eye = () => <i className="bi bi-eye"></i>;
const EyeOff = () => <i className="bi bi-eye-slash"></i>;

const roleOptions = [
  { value: "farmer", label: "Farmer" },
  { value: "owner", label: "Equipment Owner" },
  { value: "delivery", label: "Delivery Agent" },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "farmer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (formData.password.length >= 6) score += 1;
    if (formData.password.length >= 8) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[0-9!@#$%^&*]/.test(formData.password)) score += 1;
    return score;
  }, [formData.password]);

  const onChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Please enter a valid email";
    if (!/^[0-9]{10,15}$/.test(formData.phone.trim())) return "Phone must contain 10 to 15 digits";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    return "";
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const authResponse = await registerUser(formData);
      const sessionUser = mapAuthUserToSessionUser(authResponse.user);

      saveSession(sessionUser, authResponse.accessToken, true);

      try {
        await syncMyProfile(sessionUser);
        const profile = await ensureMyProfile(sessionUser);
        syncCurrentUser(mergeProfileIntoUser(sessionUser, profile));
      } catch (profileError) {
        console.warn("Profile service sync skipped during signup.", profileError);
      }

      pushAuthHistory("REGISTER", sessionUser);
      navigate(routeByRole(sessionUser.role));
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          Object.values(apiError?.response?.data?.fieldErrors || {})[0] ||
          "Unable to create account right now."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    heroSection: {
      background: `linear-gradient(135deg, rgba(0, 40, 0, 0.9), rgba(0, 80, 0, 0.8)), url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
    },
    signupCard: {
      background: "rgba(255, 255, 255, 0.97)",
      backdropFilter: "blur(10px)",
      borderRadius: "20px",
    },
  };

  const strengthLabel = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"][passwordStrength];

  return (
    <>
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.heroSection}>
        <Container>
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col md={10} lg={7}>
              <Card style={styles.signupCard} className="shadow-lg">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div className="d-inline-block bg-success p-3 rounded-circle mb-3 shadow">
                      <Tractor />
                    </div>
                    <h2 className="fw-bold">Create AgroConnect Account</h2>
                    <p className="text-muted mb-0">Register as Farmer, Owner, or Delivery Agent</p>
                  </div>

                  <Form onSubmit={handleSignUp}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <User className="me-2" /> Full Name
                          </Form.Label>
                          <Form.Control type="text" value={formData.name} onChange={(e) => onChange("name", e.target.value)} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <Mail className="me-2" /> Email
                          </Form.Label>
                          <Form.Control type="email" value={formData.email} onChange={(e) => onChange("email", e.target.value)} required />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <Phone className="me-2" /> Phone
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => onChange("phone", e.target.value)}
                            placeholder="10 to 15 digits"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Role</Form.Label>
                          <Form.Select value={formData.role} onChange={(e) => onChange("role", e.target.value)}>
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <Lock className="me-2" /> Password
                          </Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e) => onChange("password", e.target.value)}
                              required
                            />
                            <Button
                              variant="link"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="position-absolute top-50 end-0 translate-middle-y border-0"
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          </div>
                          <small className="text-muted">Password strength: {strengthLabel}</small>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <Lock className="me-2" /> Confirm Password
                          </Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showConfirmPassword ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) => onChange("confirmPassword", e.target.value)}
                              required
                            />
                            <Button
                              variant="link"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="position-absolute top-50 end-0 translate-middle-y border-0"
                            >
                              {showConfirmPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <AnimatePresence>
                      {error && (
                        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
                          <Alert variant="danger">{error}</Alert>
                        </MotionDiv>
                      )}
                    </AnimatePresence>

                    <Button type="submit" variant="success" className="w-100" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-3">
                    <small>
                      Already have an account? <Link to="/login">Sign In</Link>
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </MotionDiv>
      <SiteFooter />
    </>
  );
}
