import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { clearCart } from "../redux/slices/cartSlice";
import { toast } from "react-toastify";
import axios from "axios";
import "../styles/checkout.css";

const API = "http://localhost:5000/api";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const placed = useRef(false);

  const [address, setAddress] = useState({
    fullName: shippingAddress.fullName || user?.name || "",
    street: shippingAddress.street || "",
    city: shippingAddress.city || "",
    postalCode: shippingAddress.postalCode || "",
    country: shippingAddress.country || "",
  });

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const isAddressComplete = Object.values(address).every(
    (v) => v.trim() !== "",
  );

  const createPayPalOrder = async () => {
    try {
      const { data } = await axios.post(
        `${API}/payment/create-order`,
        { items: cartItems.map((item) => ({ productId: item._id, quantity: item.qty, size: item.size, color: item.color })) },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );
      return data.id;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create PayPal order");
      throw err;
    }
  };

  const onApprove = async (data) => {
    try {
      // The server checks prices and stock, takes the payment and saves the order.
      await axios.post(
        `${API}/payment/capture-order`,
        {
          orderID: data.orderID,
          items: cartItems.map((item) => ({ productId: item._id, quantity: item.qty, size: item.size, color: item.color })),
          address,
        },
        { headers: { Authorization: `Bearer ${user.token}` } },
      );

      placed.current = true;
      dispatch(clearCart());
      toast.success("Order placed successfully!");
      navigate("/order-success");
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed. Please try again.");
    }
  };

  useEffect(() => {
    if (cartItems.length === 0 && !placed.current) navigate("/cart");
  }, [cartItems, navigate]);

  if (cartItems.length === 0) return null;

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-form">
          <h2>Shipping Address</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={address.fullName}
              onChange={handleAddressChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="street"
              value={address.street}
              onChange={handleAddressChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={handleAddressChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={address.postalCode}
                onChange={handleAddressChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="country"
              value={address.country}
              onChange={handleAddressChange}
              required
            />
          </div>
        </div>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          {cartItems.map((item) => (
            <div key={item.cartKey} className="checkout-item">
              <span>
                {item.name}{item.size || item.color ? ` (${[item.size, item.color].filter(Boolean).join(", ")})` : ""} × {item.qty}
              </span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <hr />
          <div className="checkout-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {isAddressComplete ? (
            <div className="paypal-btn-wrapper">
              <PayPalScriptProvider
                options={{ "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID, currency: "USD" }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue", shape: "rect" }}
                  createOrder={createPayPalOrder}
                  onApprove={onApprove}
                  onError={() => toast.error("PayPal error occurred")}
                />
              </PayPalScriptProvider>
            </div>
          ) : (
            <p className="address-warning">
              Please fill in all shipping fields to pay.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;