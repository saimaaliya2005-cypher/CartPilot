import { Link } from "react-router-dom";

<footer className="bg-light text-center py-3 mt-5">
  <div className="container">
    <p className="mb-1">&copy; 2026 CartPilot. All rights reserved.</p>
    <ul className="list-inline">
      <li className="list-inline-item"><Link to="/about">About Us</Link></li>
      <li className="list-inline-item"><Link to="/contact">Contact</Link></li>
      <li className="list-inline-item"><Link to="/privacy">Privacy Policy</Link></li>
    </ul>
  </div>
</footer>

export default Footer;