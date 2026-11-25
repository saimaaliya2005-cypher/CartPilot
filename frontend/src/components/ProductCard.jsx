import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiPlus } from "react-icons/fi";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "react-toastify";
import "../styles/product.css";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const inStock = Number(product.stock) > 0;

  const hasOptions = (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0);

  const handleAdd = (e) => {
    // products with sizes/colors: let the click open the product page so the customer can choose
    if (hasOptions) return;
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ ...product, qty: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="pc-head">
        <h3 className="pc-name">{product.name}</h3>
        <p className="pc-cat">{product.category}</p>
      </div>

      <div className="product-image-wrapper">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="pc-placeholder">{product.name?.[0]}</span>
        )}
        {!inStock && <span className="out-of-stock-badge">Sold out</span>}
      </div>

      <div className="pc-foot">
        {inStock ? (
          <button className="quick-add-btn" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}>
            <FiPlus />
          </button>
        ) : (
          <span />
        )}
        <span className="product-price">${Number(product.price).toFixed(2)}</span>
      </div>
    </Link>
  );
};

export default ProductCard;
