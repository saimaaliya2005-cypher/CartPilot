import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, updateQty } from "../redux/slices/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "../styles/cart.css";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleRemove = (id, name) => {
    dispatch(removeFromCart(id));
    toast.info(`${name} removed from cart`);
  };

  const handleCheckout = () => {
    if (!user) {
      toast.warning("Please log in to checkout");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="shop-link-btn">Go Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.cartKey} className="cart-item">
              <img src={item.imageUrl || "https://via.placeholder.com/100"} alt={item.name} />
              <div className="cart-item-info">
                <Link to={`/product/${item._id}`}><h3>{item.name}</h3></Link>
                <p className="cart-item-price">${item.price?.toFixed(2)}</p>
                {(item.size || item.color) && (
                  <p className="cart-item-variant">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                )}
              </div>
              <div className="cart-item-qty">
                <select value={item.qty} onChange={(e) => dispatch(updateQty({ id: item.cartKey, qty: Number(e.target.value) }))}>
                  {[...Array(10).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>{x + 1}</option>
                  ))}
                </select>
              </div>
              <div className="cart-item-subtotal">
                ${(item.price * item.qty).toFixed(2)}
              </div>
              <button className="remove-btn" onClick={() => handleRemove(item.cartKey, item.name)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row"><span>Items ({cartItems.reduce((a, i) => a + i.qty, 0)})</span><span>${total.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <hr />
          <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
