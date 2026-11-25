import React from "react";
import { NavLink } from "react-router-dom";

// Small tab bar shown at the top of every admin page
const AdminNav = () => (
  <div className="admin-nav">
    <NavLink to="/admin" end className="admin-nav-link">Products</NavLink>
    <NavLink to="/admin/orders" className="admin-nav-link">Orders</NavLink>
  </div>
);

export default AdminNav;