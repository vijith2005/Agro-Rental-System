import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import SiteFooter from "../components/SiteFooter";

const Tractor = () => <i className="bi bi-tractor display-6"></i>;
const ArrowRight = () => <i className="bi bi-arrow-right"></i>;
const Shield = () => <i className="bi bi-shield-check display-6"></i>;
const MapPin = () => <i className="bi bi-geo-alt display-6"></i>;
const Clock = () => <i className="bi bi-clock display-6"></i>;
const Users = () => <i className="bi bi-people display-6"></i>;
const Package = () => <i className="bi bi-box display-6"></i>;
const TrendingUp = () => <i className="bi bi-graph-up display-6"></i>;
const CheckCircle = () => <i className="bi bi-check-circle-fill text-success"></i>;
const Mail = () => <i className="bi bi-envelope"></i>;
const Phone = () => <i className="bi bi-telephone"></i>;
const MapPinIcon = () => <i className="bi bi-geo-alt"></i>;
const Facebook = () => <i className="bi bi-facebook"></i>;
const Twitter = () => <i className="bi bi-twitter-x"></i>;
const Instagram = () => <i className="bi bi-instagram"></i>;
const Linkedin = () => <i className="bi bi-linkedin"></i>;

import bgImage from '../assets/farmerbg.jpg';

export default function LandingPage() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;

  const handleLogin = () => navigate('/login');
  const handleSignUp = () => navigate('/signup');

  const features = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Role-based access control ensures secure transactions and data protection',
    },
    {
      icon: MapPin,
      title: 'Secured Delivery',
      description: 'Real-time Location capturing for equipment delivery with interactive maps',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Book equipment anytime, anywhere with instant owner notifications',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Account',
      description: 'Sign up as a farmer, equipment owner, or delivery agent',
    },
    {
      step: '02',
      title: 'Browse or List',
      description: 'Farmers search equipment, owners list their machinery',
    },
    {
      step: '03',
      title: 'Book the Equipment',
      description: 'Request bookings and get instant notifications on status updates',
    },
    {
      step: '04',
      title: 'Message with the Each Other ',
      description: 'Fell free to ask you queries to each other ',
    },
  ];

  const userTypes = [
    {
      icon: Users,
      title: 'Farmers',
      description: 'Access equipment when you need it without the upfront investment. Save on maintenance costs.',
      features: ['Browse equipment', 'Book rentals', 'Track deliveries', 'Rate equipment'],
    },
    {
      icon: Package,
      title: 'Equipment Owners',
      description: 'Monetize your idle equipment and help the farming community grow sustainably.',
      features: ['List equipment', 'Manage bookings', 'Track earnings', 'Approve requests'],
    },
    {
      icon: TrendingUp,
      title: 'Delivery Agents',
      description: 'Earn by facilitating equipment transport between owners and farmers.',
      features: ['View routes', 'Update status', 'Track deliveries', 'Earn commission'],
    },
  ];

  const stats = [
    { number: '5000+', label: 'Equipment Listed' },
    { number: '10,000+', label: 'Active Users' },
    { number: '50,000+', label: 'Successful Rentals' },
    { number: '98%', label: 'Satisfaction Rate' },
  ];

  const benefits = [
    'Verified equipment owners',
    'Transparent pricing',
    'Insurance coverage options',
    'Flexible rental periods',
    'Quality assurance checks',
    'Dedicated customer support',
  ];

 
  const styles = {
    heroSection: {
      background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      color: 'white',
    },
    featureCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    statsSection: {
      background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
      padding: '60px 0',
    },
    ctaSection: {
      background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
      padding: '80px 0',
      color: 'white',
    },
    footer: {
      background: 'linear-gradient(135deg, #1a472a 0%, #2e7d32 100%)',
      color: 'white',
      padding: '60px 0 20px',
    },
  };

  return (
    <div className="overflow-hidden">
  
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merienda:wght@400;500;600;700;800&display=swap" />
   
      <style jsx>{`
        body {
          font-family: 'Merienda', cursive;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Merienda', cursive;
          font-weight: 700;
          letter-spacing: 0;
        }
        
        .display-1, .display-2, .display-3, .display-4, .display-5, .display-6 {
          font-family: 'Merienda', cursive !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
        }
        
        .lead {
          font-family: 'Merienda', cursive;
          font-weight: 400;
          line-height: 1.8;
        }
        
        .card-title, .card-text {
          font-family: 'Merienda', cursive;
        }
        
        p {
          font-family: 'Merienda', cursive;
          line-height: 1.8;
          font-size: 1.1rem;
        }
        
        .btn {
          font-family: 'Merienda', cursive;
          font-weight: 600;
          letter-spacing: 0;
          text-transform: none;
        }
        
        .navbar, .footer {
          font-family: 'Merienda', cursive;
        }
        
        .feature-title {
          font-family: 'Merienda', cursive;
          font-weight: 700;
        }
        
        .stat-number {
          font-family: 'Merienda', cursive;
          font-weight: 700;
        }
        
        .quote-text {
          font-family: 'Merienda', cursive;
          font-style: normal;
        }
        
        .section-subtitle {
          font-family: 'Merienda', cursive;
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
        }
        
        /* Farmer rental theme specific styles */
        .farm-theme-text {
          font-family: 'Merienda', cursive;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .farm-theme-description {
          font-family: 'Merienda', cursive;
          color: #5d6d7e;
          line-height: 1.9;
        }
        
        .rustic-text {
          font-family: 'Merienda', cursive;
          font-weight: 400;
          color: #4a5d23;
        }
        
        .modern-farm {
          font-family: 'Merienda', cursive;
          font-weight: 500;
          letter-spacing: 0;
        }
        
        /* Gradient Text Styles */
        .gradient-heading {
          background: linear-gradient(135deg, #f1c40f 0%, #e67e22 50%, #d35400 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
        }
        
        .gradient-gold {
          background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-green {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #1e8449 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-sunset {
          background: linear-gradient(135deg, #e67e22 0%, #d35400 50%, #a04000 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-harvest {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 50%, #16a085 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-forest {
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 50%, #1abc9c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-wheat {
          background: linear-gradient(135deg, #f1c40f 0%, #d4ac0d 50%, #b7950b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-earth {
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-sky {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 50%, #1c598b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-sunrise {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 50%, #d35400 70%, #e74c3c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-leaf {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #16a085 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-honey {
          background: linear-gradient(135deg, #f1c40f 0%, #d4ac0d 50%, #b9770e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-rainbow-farm {
          background: linear-gradient(135deg, #f1c40f 0%, #2ecc71 30%, #3498db 60%, #e67e22 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-amber {
          background: linear-gradient(135deg, #FFBF00 0%, #FF9F00 50%, #FF8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-emerald {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #1e8449 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-terracotta {
          background: linear-gradient(135deg, #e67e22 0%, #d35400 50%, #ba6b1f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hover-gradient:hover {
          background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s ease;
        }
        
        .harvest-heading {
          font-family: 'Merienda', cursive;
          font-weight: 700;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Card hover effects */
        .gradient-card {
          transition: all 0.3s ease;
        }
        
        .gradient-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(46, 204, 113, 0.2);
        }
        
        /* Button gradient effects */
        .btn-gradient {
          background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
          background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
          transform: scale(1.05);
        }
        
        .btn-gradient-green {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-gradient-green:hover {
          background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
          transform: scale(1.05);
        }
      `}</style>

      <section style={styles.heroSection}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <MotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                 
                  <h1 className="display-2 fw-bold gradient-harvest">
                    Agro Connect
                  </h1>
                </div>
                <p className="display-6 mb-3 gradient-sunrise">
                  Your Complete Agricultural Equipment Marketplace
                </p>
                <p className="lead mb-5 gradient-wheat" 
                   style={{ fontSize: '1.3rem', fontWeight: 400 }}>
                  Connect equipment owners with farmers. Field-Ready • Mobile Optimized • Real-Time Tracking
                </p>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="d-flex gap-3 justify-content-center mb-5"
              >
                  <Button 
                    size="lg" 
                    onClick={handleLogin}
                    className="px-5 py-3 fw-bold btn-gradient"
                    style={{ 
                    fontFamily: "'Merienda', cursive", 
                    letterSpacing: '1px',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  SIGN IN <ArrowRight />
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  onClick={handleSignUp}
                  className="px-5 py-3 fw-bold"
                  style={{ 
                    fontFamily: "'Merienda', cursive", 
                    letterSpacing: '1px',
                    background: 'transparent',
                    border: '2px solid white',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)';
                    e.target.style.border = 'none';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.border = '2px solid white';
                  }}
                >
                  CREATE ACCOUNT
                </Button>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Row className="g-4">
                  {features.map((feature, index) => (
                    <Col md={4} key={index}>
                      <Card style={styles.featureCard} className="h-100 border-0 gradient-card">
                        <Card.Body className="text-center p-4">
                          <div className="p-3 rounded-circle d-inline-block mb-3"
                               style={{ background: 'linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)' }}>
                            <feature.icon />
                          </div>
                          <h3 className="h5 fw-bold mb-2 gradient-gold">
                            {feature.title}
                          </h3>
                          <p className="mb-0 opacity-75" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {feature.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </MotionDiv>
            </Col>
          </Row>
        </Container>
      </section>

      <section style={styles.statsSection}>
        <Container>
          <Row className="g-4">
            {stats.map((stat, index) => (
              <Col md={3} sm={6} key={index}>
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center text-white"
                >
                  <h2 className="display-4 fw-bold mb-2 gradient-wheat">
                    {stat.number}
                  </h2>
                  <p className="lead mb-0 opacity-75 text-white">
                    {stat.label}
                  </p>
                </MotionDiv>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="py-5 bg-light">
        <Container>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <h2 className="display-4 fw-bold mb-3 gradient-harvest">
              How It Works
            </h2>
            <p className="lead text-muted mx-auto gradient-earth" 
               style={{ maxWidth: '600px', fontWeight: 400 }}>
              Get started in four simple steps and join thousands of farmers and equipment owners
            </p>
          </MotionDiv>

          <Row className="g-4">
            {howItWorks.map((step, index) => (
              <Col lg={3} md={6} key={index}>
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-100 border-0 shadow-sm gradient-card">
                    <Card.Body className="p-4">
                      <div className="display-1 fw-bold mb-3 gradient-gold"
                           style={{ opacity: 0.5 }}>
                        {step.step}
                      </div>
                      <h3 className="h4 fw-bold mb-2 gradient-green">
                        {step.title}
                      </h3>
                      <p className="text-muted mb-0 gradient-earth">
                        {step.description}
                      </p>
                    </Card.Body>
                  </Card>
                </MotionDiv>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="py-5 bg-white">
        <Container>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <h2 className="display-4 fw-bold mb-3 gradient-rainbow-farm">
              Who We Serve
            </h2>
            <p className="lead text-muted mx-auto gradient-terracotta" 
               style={{ maxWidth: '600px', fontWeight: 400 }}>
              Agro Connect  brings together the entire agricultural equipment ecosystem
            </p>
          </MotionDiv>

          <Row className="g-4">
            {userTypes.map((type, index) => (
              <Col md={4} key={index}>
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-100 border-0 shadow-lg gradient-card">
                    <Card.Body className="p-4">
                      <div className="p-3 rounded-circle d-inline-block mb-3"
                           style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                        <type.icon />
                      </div>
                      <h3 className="h3 fw-bold mb-3 gradient-green">
                        {type.title}
                      </h3>
                      <p className="text-muted mb-4 gradient-earth">
                        {type.description}
                      </p>
                      <ul className="list-unstyled">
                        {type.features.map((feature, idx) => (
                          <li key={idx} className="mb-2">
                            <CheckCircle /> <span className="ms-2 gradient-gold">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </Card.Body>
                  </Card>
                </MotionDiv>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="py-5 bg-light">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="display-4 fw-bold mb-4 gradient-harvest">
                  Why Choose AgroConnect ?
                </h2>
                <p className="lead text-muted mb-4 gradient-earth" style={{ fontWeight: 400 }}>
                  We're committed to making agricultural equipment accessible and affordable for every farmer while helping owners maximize their equipment utilization.
                </p>
                <Row className="g-3">
                  {benefits.map((benefit, index) => (
                    <Col sm={6} key={index}>
                      <div className="d-flex align-items-start gap-2">
                        <CheckCircle />
                        <span className="gradient-green">{benefit}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </MotionDiv>
            </Col>

            <Col lg={6}>
              <MotionDiv
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Row className="g-4">
                  <Col sm={6}>
                    <Card className="border-0" 
                          style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                      <Card.Body className="p-4 text-white">
                        <Tractor />
                        <h3 className="display-6 fw-bold mt-3 mb-1 gradient-wheat">
                          500+
                        </h3>
                        <p className="opacity-75 mb-0 text-white">
                          Equipment Types
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={6}>
                    <Card className="border-0"
                          style={{ background: 'linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)' }}>
                      <Card.Body className="p-4 text-white">
                        <Users />
                        <h3 className="display-6 fw-bold mt-3 mb-1 gradient-wheat">
                          200+
                        </h3>
                        <p className="opacity-75 mb-0 text-white">
                          Cities Covered
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={6}>
                    <Card className="border-0"
                          style={{ background: 'linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)' }}>
                      <Card.Body className="p-4 text-white">
                        <Clock />
                        <h3 className="display-6 fw-bold mt-3 mb-1 gradient-wheat">
                          24/7
                        </h3>
                        <p className="opacity-75 mb-0 text-white">
                          Support Available
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={6}>
                    <Card className="border-0"
                          style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                      <Card.Body className="p-4 text-white">
                        <Shield />
                        <h3 className="display-6 fw-bold mt-3 mb-1 gradient-wheat">
                          100%
                        </h3>
                        <p className="opacity-75 mb-0 text-white">
                          Secure Payments
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </MotionDiv>
            </Col>
          </Row>
        </Container>
      </section>

      <section style={styles.ctaSection}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="display-4 fw-bold mb-4 gradient-wheat">
                  Ready to Get Started?
                </h2>
                <p className="lead mb-5 text-white" style={{ fontWeight: 400 }}>
                  Join AgroRent Pro today and transform the way you access agricultural equipment
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <Button 
                    size="lg" 
                    onClick={handleLogin}
                    className="px-5 py-3 fw-bold"
                    style={{ 
                      background: 'white',
                      border: 'none',
                      color: '#2ecc71',
                      fontFamily: "'Merienda', cursive",
                      letterSpacing: '1px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = '#2ecc71';
                    }}
                  >
                    Get Started Now <ArrowRight />
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="lg" 
                    onClick={handleLogin}
                    className="px-5 py-3 fw-bold"
                    style={{ 
                      fontFamily: "'Merienda', cursive", 
                      letterSpacing: '1px',
                      border: '2px solid white',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = '#2ecc71';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'white';
                    }}
                  >
                    Learn More
                  </Button>
                </div>
              </MotionDiv>
            </Col>
          </Row>
        </Container>
      </section>

      <SiteFooter />

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
    </div>
  );
}
