import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import bgImage from "../assets/hero.jpg";
import SiteFooter from "../components/SiteFooter";
import { mapAuthUserToSessionUser, mergeProfileIntoUser, routeByRole } from "../utils/auth";
import { loginUser } from "../api/authApi";
import { ensureMyProfile } from "../api/profileApi";
import { saveSession, syncCurrentUser, pushAuthHistory } from "../utils/session";

const Tractor = () => <i className="bi bi-tractor fs-1"></i>;
const Mail = () => <i className="bi bi-envelope"></i>;
const Lock = () => <i className="bi bi-lock"></i>;
const Eye = () => <i className="bi bi-eye"></i>;
const EyeOff = () => <i className="bi bi-eye-slash"></i>;

export default function LoginPage() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) {
      setError("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const authResponse = await loginUser(formData);
      const sessionUser = mapAuthUserToSessionUser(authResponse.user);

      saveSession(sessionUser, authResponse.accessToken, rememberMe);

      try {
        const profile = await ensureMyProfile(sessionUser);
        syncCurrentUser(mergeProfileIntoUser(sessionUser, profile));
      } catch (profileError) {
        console.warn("Profile service sync skipped during login.", profileError);
      }

      pushAuthHistory("LOGIN");
      navigate(routeByRole(sessionUser.role));
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          apiError?.response?.data?.fieldErrors?.email ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    heroSection: {
      background: `linear-gradient(135deg, rgba(0,40,0,0.85), rgba(0,80,0,0.75)), url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
    },
    loginCard: {
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(10px)",
      borderRadius: "20px",
    },
  };

  return (
    <>
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.heroSection}>
        <Container>
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col md={8} lg={5}>
              <Card style={styles.loginCard} className="shadow-lg">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div className="d-inline-block bg-success p-3 rounded-circle mb-3 shadow">
                      <Tractor />
                    </div>
                    <h2 className="fw-bold">AgroRent Pro</h2>
                    <p className="text-muted">Sign in to continue</p>
                  </div>

                  <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Mail className="me-2" /> Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Lock className="me-2" /> Password
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={handleChange}
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
                    </Form.Group>

                    <Form.Check
                      type="checkbox"
                      label="Remember me"
                      className="mb-3"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />

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
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-3">
                    <small>
                      Don&apos;t have an account? <Link to="/signup">Create Account</Link>
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
