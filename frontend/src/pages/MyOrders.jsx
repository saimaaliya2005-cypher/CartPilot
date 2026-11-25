import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders } from "../redux/slices/orderSlice";
import { Link } from "react-router-dom";
import "../styles/myOrders.css";

const MyOrders = () => {
  const dispatch = useDispatch();
  const { myOrders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  return (
    <div className="my-orders-container">
      <h1>My Orders</h1>
      {myOrders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="shop-link-btn">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {myOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="order-id">Order #{order._id.slice(-8)}</span>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
              </div>
              <div className="order-items">
                {order.items?.map((i, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{i.productId?.name || "Product"} × {i.quantity}</span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-footer">
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="order-total">Total: ${order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
