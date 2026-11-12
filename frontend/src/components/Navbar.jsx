import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";   // optional – add a small logo file

const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
    <div className="container-fluid">
      <Link className="navbar-brand d-flex align-items-center" to="/">
        <img src={logo} alt="CartPilot" width="30" className="me-2" />
        CartPilot
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarsExample"
        aria-controls="navbarsExample"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarsExample">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
          <li className="nav-item"><Link className="nav-link" to="/shop">Shop</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/cart">Cart</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
        </ul>
      </div>
    </div>
  </nav>
);


export default Navbar;