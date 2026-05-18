import React from "react";

const SiteFooter = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-columns">
          <div className="site-footer-col">
            <div className="site-footer-heading">Product</div>
            <a href="#">Equipment</a>
            <a href="#">Bookings</a>
            <a href="#">Payments</a>
            <a href="#">Pricing</a>
            <a href="#">Mobile App</a>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-heading">Solutions</div>
            <a href="#">Farm Rentals</a>
            <a href="#">Labour Hire</a>
            <a href="#">Seasonal Plans</a>
            <a href="#">Enterprise</a>
            <a href="#">Partnerships</a>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-heading">Learn</div>
            <a href="#">Blog</a>
            <a href="#">Guides</a>
            <a href="#">Equipment Care</a>
            <a href="#">Safety</a>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-heading">Support</div>
            <a href="#">Help Center</a>
            <a href="#">Contact</a>
            <a href="#">Report Issue</a>
            <a href="#">System Status</a>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-heading">Company</div>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
            <a href="#">Legal</a>
          </div>
        </div>

        <div className="site-footer-brand">
          <div className="site-footer-logo">AGRO RENT</div>
          <p className="site-footer-text">
            Agro Rent helps farmers access modern equipment and trusted
            operators to grow faster, reduce downtime, and manage costs
            confidently.
          </p>
          <div className="site-footer-mini-links">
            <a href="#">About</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© 2026 Agro Rent. All rights reserved.</span>
        <div className="site-footer-legal">
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
