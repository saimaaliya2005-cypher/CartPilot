import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/slices/cartSlice";
import { FaStar, FaCartPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import "../styles/product.css";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ ...product, qty: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="product-image-wrapper">
        <img src={product.imageUrl || "https://via.placeholder.com/300"} alt={product.name} />
        {Number(product.stock) <= 0 && <span className="out-of-stock-badge">Out of Stock</span>}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-category-tag">{product.category}</p>
        <div className="product-rating-row">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} size={12} color={i < Math.round(product.rating) ? "#f5a623" : "#ddd"} />
          ))}
          <span>({product.numReviews})</span>
        </div>
        <div className="product-bottom">
          <span className="product-price">${product.price?.toFixed(2)}</span>
          {Number(product.stock) > 0 && (
            <button className="quick-add-btn" onClick={handleAdd}><FaCartPlus /></button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
