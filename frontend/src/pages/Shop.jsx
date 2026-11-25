import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../redux/slices/productSlice";
import ProductCard from "../components/ProductCard";
import "../styles/shop.css";

const Shop = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "All");

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const categories = ["All", ...new Set(items.map((p) => p.category))];

  const filtered = items.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || p.category === category;
    return matchSearch && matchCategory;
  });

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1 className="display shop-title">Shop All</h1>
        <div className="shop-filters">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="products-grid">
        {filtered.length > 0 ? (
          filtered.map((product) => <ProductCard key={product._id} product={product} />)
        ) : (
          <p className="no-products">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default Shop;
