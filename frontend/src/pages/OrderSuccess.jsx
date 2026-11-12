import React from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import "../styles/orderSuccess.css";

const OrderSuccess = () => {
  return (
    <div className="order-success">
      <FaCheckCircle className="success-icon" />
      <h1>Order Placed Successfully!</h1>
      <p>Thank you for your purchase. You will receive a confirmation email shortly.</p>
      <div className="success-actions">
        <Link to="/my-orders" className="view-orders-btn">View My Orders</Link>
        <Link to="/shop" className="continue-shopping-btn">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
