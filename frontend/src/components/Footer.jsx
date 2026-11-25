import React from "react";
import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";
import "../styles/footer.css";

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-top">
        <div>
          <div className="footer-brand">{BRAND}</div>
          <p className="footer-tag">Considered clothing, quietly made.</p>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All products</Link></li>
              <li><Link to="/#collections">Collections</Link></li>
              <li><Link to="/cart">Cart</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Create account</Link></li>
              <li><Link to="/my-orders">My orders</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
