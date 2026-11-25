import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiShoppingBag, FiMenu, FiX } from "react-icons/fi";
import { logout } from "../redux/slices/authSlice";
import { BRAND } from "../config/brand";
import "../styles/navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const [open, setOpen] = useState(false);

  const count = cartItems.reduce((n, item) => n + (item.qty || 0), 0);

  // close the mobile menu whenever the page changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    navigate("/");
  };

  const accountLinks = user ? (
    <>
      <NavLink className="nav-link" to="/my-orders">Orders</NavLink>
      <button className="nav-link" onClick={handleLogout}>Logout</button>
    </>
  ) : (
    <>
      <NavLink className="nav-link" to="/login">Account</NavLink>
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="nav-left">
          <button
            className="nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
          <NavLink className="nav-link" to="/shop">Shop</NavLink>
          <Link className="nav-link" to="/#collections">Collections</Link>
        </div>

        <Link to="/" className="nav-brand">{BRAND}</Link>

        <div className="nav-right">
          {accountLinks}
          <Link to="/cart" className="nav-cart" aria-label={`Cart, ${count} items`}>
            <FiShoppingBag />
            {count > 0 && <span className="nav-cart-count">{count}</span>}
          </Link>
        </div>
      </div>

      {open && (
        <nav className="nav-panel">
          <NavLink className="nav-link" to="/shop">Shop</NavLink>
          <Link className="nav-link" to="/#collections">Collections</Link>
          {user ? (
            <>
              <NavLink className="nav-link" to="/my-orders">My orders</NavLink>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink className="nav-link" to="/login">Login</NavLink>
              <NavLink className="nav-link" to="/register">Create account</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
