import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import AdminNav from "./AdminNav";
import "../styles/admin.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const EMPTY = { name: "", description: "", price: "", category: "", stock: "", sizes: "", colors: "" };

const AdminProducts = () => {
  const { user } = useSelector((state) => state.auth);
  const auth = { headers: { Authorization: `Bearer ${user.token}` } };

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/products`);
      setProducts(data);
    } catch (err) {
      toast.error("Could not load products");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e) => {
    const f = e.target.files[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const reset = () => {
    setForm(EMPTY);
    setFile(null);
    setPreview("");
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      sizes: (p.sizes || []).join(", "),
      colors: (p.colors || []).join(", "),
    });
    setFile(null);
    setPreview(p.imageUrl || "");
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await axios.delete(`${API}/products/${p._id}`, auth);
      toast.success("Product deleted");
      if (editingId === p._id) reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !file) {
      toast.error("Please choose a product photo");
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    if (file) body.append("image", file);

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/products/${editingId}`, body, auth);
        toast.success("Product updated");
      } else {
        await axios.post(`${API}/products`, body, auth);
        toast.success("Product added");
      }
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-wrap">
      <AdminNav />
      <h1 className="display admin-title">Products</h1>

      <form className="admin-form" onSubmit={onSubmit}>
        <h2 className="admin-form-title">{editingId ? "Edit product" : "Add product"}</h2>

        <div className="admin-grid">
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>
            Category
            <input
              name="category"
              value={form.category}
              onChange={onChange}
              placeholder="e.g. Hoodies"
              required
            />
          </label>
          <label>
            Price ($)
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={onChange} required />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" value={form.stock} onChange={onChange} required />
          </label>
        </div>

        <div className="admin-grid">
          <label>
            Sizes <em>(comma separated, leave empty if none)</em>
            <input name="sizes" value={form.sizes} onChange={onChange} placeholder="S, M, L, XL" />
          </label>
          <label>
            Colors <em>(comma separated, leave empty if none)</em>
            <input name="colors" value={form.colors} onChange={onChange} placeholder="Black, Olive, Cream" />
          </label>
        </div>

        <label>
          Description
          <textarea name="description" rows="3" value={form.description} onChange={onChange} required />
        </label>

        <label>
          Photo {editingId && <em>(leave empty to keep the current one)</em>}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} />
        </label>

        {preview && (
          <div className="admin-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <div className="admin-actions">
          <button className="btn-pill btn-pill--dark" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button className="btn-pill admin-cancel" type="button" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="admin-form-title admin-list-title">All products ({products.length})</h2>
      <div className="admin-list">
        {products.length === 0 && <p className="empty-note">No products yet.</p>}
        {products.map((p) => (
          <div className="admin-row" key={p._id}>
            <div className="admin-thumb">
              {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span>{p.name?.[0]}</span>}
            </div>
            <div className="admin-info">
              <strong>{p.name}</strong>
              <span>
                {p.category} · ${Number(p.price).toFixed(2)} · stock {p.stock}
              </span>
            </div>
            <div className="admin-row-actions">
              <button className="admin-link" onClick={() => onEdit(p)}>Edit</button>
              <button className="admin-link admin-link--danger" onClick={() => onDelete(p)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;