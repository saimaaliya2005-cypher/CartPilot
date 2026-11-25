import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiAward, FiFeather, FiRefreshCw, FiTruck, FiPlus } from "react-icons/fi";
import { fetchProducts } from "../redux/slices/productSlice";
import ProductCard from "../components/ProductCard";
import { BRAND } from "../config/brand";
import "../styles/home.css";

// Drop your hero photo at frontend/public/images/hero.jpg (model, clean backdrop, 2000px+ wide).
const HERO_IMAGE = "/images/hero.jpg";

// Placeholder copy - edit freely, and only keep claims that are true for your store.
const TRUST = [
  { icon: FiAward, title: "Premium Fabrics", text: "Carefully chosen materials, made to last." },
  { icon: FiFeather, title: "Built For Comfort", text: "Relaxed cuts you can wear all day." },
  { icon: FiRefreshCw, title: "Easy Exchanges", text: "Wrong size? We'll make it right." },
  { icon: FiTruck, title: "Tracked Shipping", text: "Follow your order from our door to yours." },
];

const Home = () => {
  const dispatch = useDispatch();
  const { hash } = useLocation();
  const { items } = useSelector((state) => state.products);
  const [heroOk, setHeroOk] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // lets the "Collections" link scroll to the section
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  // newest first, rating as tiebreak (swap for a real "bestseller" flag later)
  const featuredList = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          (b.rating || 0) - (a.rating || 0) ||
          new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [items]
  );

  const spotlight = featuredList.find((p) => p.imageUrl && Number(p.stock) > 0) || featuredList[0];
  const newArrivals = featuredList.slice(0, 8);

  const collections = useMemo(() => {
    const map = {};
    items.forEach((p) => {
      if (!p.category) return;
      if (!map[p.category]) map[p.category] = { name: p.category, count: 0, image: "" };
      map[p.category].count += 1;
      if (!map[p.category].image && p.imageUrl) map[p.category].image = p.imageUrl;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [items]);

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <h1 className="sr-only">{BRAND}</h1>
        <img
          className="hero-img"
          src={HERO_IMAGE}
          alt=""
          style={{ display: heroOk ? "block" : "none" }}
          onLoad={() => setHeroOk(true)}
          onError={() => setHeroOk(false)}
        />
        {!heroOk && (
          <div className="hero-fallback">
            <span className="eyebrow">New season</span>
            <p className="display hero-fallback-title">
              Quiet clothes,
              <br />
              made to be worn.
            </p>
          </div>
        )}

        <div className="hero-pill">
          <div className="hero-pill-thumb">
            {spotlight?.imageUrl ? <img src={spotlight.imageUrl} alt="" /> : null}
          </div>
          <div className="hero-pill-text">
            <div className="hero-pill-title">{spotlight ? spotlight.name : "New collection"}</div>
            <div className="hero-pill-sub">
              {spotlight
                ? `${spotlight.category} · $${Number(spotlight.price).toFixed(2)}`
                : "Just landed"}
            </div>
          </div>
          <Link
            to={spotlight ? `/product/${spotlight._id}` : "/shop"}
            className="btn-pill btn-pill--light"
          >
            Shop
          </Link>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="trust">
        <div className="trust-inner">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div className="trust-item" key={title}>
              <Icon className="trust-icon" />
              <div>
                <div className="trust-title">{title}</div>
                <p className="trust-text">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS (becomes "Bestsellers" once you add a bestseller flag) */}
      <section className="section section--white">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <span className="eyebrow">Just in</span>
              <h2 className="display section-title">New Arrivals</h2>
            </div>
            <Link to="/shop" className="btn-pill btn-pill--dark">Explore all</Link>
          </div>

          {newArrivals.length > 0 ? (
            <div className="bs-row">
              {newArrivals.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <p className="empty-note">New pieces arriving soon.</p>
          )}
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="section" id="collections">
        <div className="section-inner">
          <div className="section-head section-head--center">
            <span className="eyebrow">Shop by collection</span>
            <h2 className="display section-title">Find Your Perfect Fit.</h2>
          </div>

          {collections.length > 0 ? (
            <div className="col-grid">
              {collections.map((c) => (
                <Link
                  key={c.name}
                  to={`/shop?category=${encodeURIComponent(c.name)}`}
                  className="col-tile"
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} loading="lazy" />
                  ) : (
                    <span className="col-tile-initial">{c.name[0]}</span>
                  )}
                  <span className="col-label">
                    {c.name}
                    <FiPlus />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-note">Collections will appear once products are added.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
