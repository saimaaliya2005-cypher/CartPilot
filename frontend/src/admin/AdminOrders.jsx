import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import AdminNav from "./AdminNav";
import "../styles/admin.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const STATUSES = ["pending", "shipped", "delivered"];

const AdminOrders = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${user.token}` }), [user.token]);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/orders`, { headers });
      setOrders(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order, status) => {
    if (status === order.status) return;
    setSavingId(order._id);
    try {
      await axios.put(`${API}/orders/${order._id}/status`, { status }, { headers });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status } : o)));
      toast.success(`Order marked ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    } finally {
      setSavingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: orders.length };
    STATUSES.forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
  }, [orders]);

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="admin-wrap admin-wrap--wide">
      <AdminNav />
      <h1 className="display admin-title">Orders</h1>

      <div className="admin-tabs">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            className={`admin-tab ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {loading && <p className="empty-note">Loading orders...</p>}
      {!loading && visible.length === 0 && <p className="empty-note">No orders here yet.</p>}

      <div className="ao-list">
        {visible.map((o) => (
          <div className="ao-card" key={o._id}>
            <div className="ao-top">
              <div>
                <div className="ao-id">Order #{o._id.slice(-8)}</div>
                <div className="ao-meta">
                  {new Date(o.createdAt).toLocaleString()} · {o.user?.name || "Deleted user"}
                  {o.user?.email ? ` (${o.user.email})` : ""}
                </div>
              </div>
              <select
                className={`ao-status status-${o.status}`}
                value={o.status}
                disabled={savingId === o._id}
                onChange={(e) => changeStatus(o, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="ao-body">
              <div className="ao-items">
                {o.items?.map((i, idx) => (
                  <div className="ao-item" key={idx}>
                    <span>
                      {i.productId?.name || "Removed product"}
                      {i.size || i.color ? ` (${[i.size, i.color].filter(Boolean).join(", ")})` : ""} × {i.quantity}
                    </span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="ao-item ao-total">
                  <span>Total</span>
                  <span>${Number(o.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="ao-address">
                <span className="eyebrow">Ship to</span>
                <p>
                  {o.address?.fullName}
                  <br />
                  {o.address?.street}
                  <br />
                  {o.address?.city} {o.address?.postalCode}
                  <br />
                  {o.address?.country}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;