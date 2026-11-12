import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, clearSelectedProduct } from "../redux/slices/productSlice";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "react-toastify";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import "../styles/productDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading, error } = useSelector((state) => state.products);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearSelectedProduct());
  }, [dispatch, id]);

  const handleAddToCart = () => {
    dispatch(addToCart({ ...product, qty }));
    toast.success("Added to cart!");
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;
  if (!product) return null;

  return (
    <div className="product-detail">
      <div className="product-detail-image">
        <img src={product.imageUrl || "https://via.placeholder.com/500"} alt={product.name} />
      </div>
      <div className="product-detail-info">
        <h1>{product.name}</h1>
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < Math.round(product.rating) ? "#f5a623" : "#ddd"} />
          ))}
          <span>({product.numReviews} reviews)</span>
        </div>
        <p className="product-price">${product.price?.toFixed(2)}</p>
        <p className="product-category">Category: {product.category}</p>
        <p className="product-description">{product.description}</p>
        <p className={`product-stock ${Number(product.stock) > 0 ? "in-stock" : "out-of-stock"}`}>
          {Number(product.stock) > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
        </p>
        {Number(product.stock) > 0 && (
          <div className="product-actions">
            <div className="qty-selector">
              <label>Qty:</label>
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {[...Array(Math.min(Number(product.stock), 10)).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>{x + 1}</option>
                ))}
              </select>
            </div>
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart /> Add to Cart
            </button>
          </div>
        )}
        <button className="back-btn" onClick={() => navigate("/shop")}>← Back to Shop</button>
      </div>
    </div>
  );
};

export default ProductDetail;
