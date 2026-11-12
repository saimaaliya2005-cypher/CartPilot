import { Link } from "react-router-dom";

const Home = () => (
  <div className="container my-5">
    {/* HERO */}
    <section className="bg-primary text-white text-center py-5 rounded-3">
      <h1 className="display-4">Welcome to CartPilot</h1>
      <p className="lead">
        Your one‑stop shop for all your needs. Explore our curated collection.
      </p>
      <Link to="/shop" className="btn btn-light btn-lg mt-3">
        Start Shopping
      </Link>
    </section>
  </div>
);

export default Home;