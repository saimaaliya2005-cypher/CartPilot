import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, clearSelectedProduct } from "../redux/slices/productSlice";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import "../styles/productDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading, error } = useSelector((state) => state.products);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearSelectedProduct());
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (product.sizes?.length && !size) {
      toast.error("Please choose a size");
      return;
    }
    if (product.colors?.length && !color) {
      toast.error("Please choose a color");
      return;
    }
    dispatch(addToCart({ ...product, qty, size, color }));
    toast.success("Added to cart!");
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;
  if (!product) return null;

  const inStock = Number(product.stock) > 0;

  return (
    <div className="product-detail">
      <div className="product-detail-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <span className="pd-placeholder">{product.name?.[0]}</span>
        )}
      </div>

      <div className="product-detail-info">
        <button className="back-btn" onClick={() => navigate("/shop")}>
          ← Back to shop
        </button>

        <span className="eyebrow">{product.category}</span>
        <h1 className="display pd-title">{product.name}</h1>

        <div className="pd-rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} size={12} color={i < Math.round(product.rating) ? "#0a0a0a" : "#c9c9c9"} />
          ))}
          <span>({product.numReviews} reviews)</span>
        </div>

        <p className="pd-price">${Number(product.price).toFixed(2)}</p>
        <p className="pd-description">{product.description}</p>

        <p className={`pd-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
          {inStock ? `In stock (${product.stock})` : "Sold out"}
        </p>

        {product.colors?.length > 0 && (
          <div className="pd-option">
            <span className="eyebrow">Color{color ? `: ${color}` : ""}</span>
            <div className="pd-pills">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`pd-pill ${color === c ? "active" : ""}`}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizes?.length > 0 && (
          <div className="pd-option">
            <span className="eyebrow">Size{size ? `: ${size}` : ""}</span>
            <div className="pd-pills">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pd-pill ${size === s ? "active" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {inStock && (
          <div className="pd-actions">
            <label className="pd-qty">
              <span className="eyebrow">Qty</span>
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {[...Array(Math.min(Number(product.stock), 10)).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>{x + 1}</option>
                ))}
              </select>
            </label>
            <button className="btn-pill btn-pill--dark pd-add" onClick={handleAddToCart}>
              Add to cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;