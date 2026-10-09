import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatPrice(value) {
  return `Rs. ${Number(value).toLocaleString("en-PK")}`;
}

function Checkout() {
  const { user, token, isAuthenticated } = useAuth();
  const { items, itemCount, subtotal } = useCart();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />;
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <span className="menu-eyebrow">NOTHING TO CHECK OUT YET</span>
          <h1>Your cart is empty.</h1>
          <p>Add a few favourites from the menu before checking out.</p>
          <Link className="cart-primary-button" to="/menu">Explore the menu</Link>
        </section>
      </main>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryAddress,
          phone,
          items: items.map((item) => ({ menuItemId: Number(item.id), quantity: item.quantity })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not place your order.");
      // Only clear the cart after the API confirms the order was saved.
      window.dispatchEvent(new CustomEvent("cafeserve:order-placed"));
      navigate(`/orders/${result.data.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="checkout-page">
      <section className="checkout-intro">
        <span className="menu-eyebrow">ALMOST AT YOUR DOOR</span>
        <h1>Let's get it <span>to you.</span></h1>
        <p>Hey {user?.name?.split(" ")[0] || "there"}, confirm your delivery details and we’ll take it from here.</p>
      </section>
      <div className="checkout-layout">
        <section className="checkout-panel">
          <div className="checkout-panel__heading"><span>01</span><div><h2>Delivery details</h2><p>Where should we bring your order?</p></div></div>
          <form id="checkout-form" className="auth-form checkout-form" onSubmit={handleSubmit}>
            <label>Contact phone<input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+92 300 1234567" minLength={7} maxLength={25} required /></label>
            <label>Full delivery address<textarea autoComplete="street-address" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="House / apartment, street, area, city" minLength={8} maxLength={500} rows={4} required /></label>
            <div className="checkout-payment-note"><span aria-hidden="true">◈</span><div><strong>Cash on delivery</strong><p>Payment is collected when your order arrives. Online payments are not enabled in this demo.</p></div></div>
            {error && <p className="auth-error" role="alert">{error}</p>}
          </form>
        </section>
        <aside className="checkout-summary">
          <span className="cart-summary__eyebrow">YOUR SELECTION</span>
          <h2>Order summary</h2>
          <div className="checkout-summary__items">
            {items.map((item) => (
              <div className="checkout-summary__item" key={item.id}>
                <div className="checkout-summary__thumb">{item.image ? <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span>🍽️</span>}</div>
                <div className="checkout-summary__name"><strong>{item.name}</strong><span>Qty {item.quantity}</span></div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="cart-summary__line"><span>Items · {itemCount}</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="cart-summary__line"><span>Delivery</span><span className="cart-summary__muted">Confirmed by cafe</span></div>
          <div className="cart-summary__total"><span>Estimated total</span><strong>{formatPrice(subtotal)}</strong></div>
          <button className="cart-primary-button cart-primary-button--full" type="submit" form="checkout-form" disabled={submitting}>{submitting ? "Placing your order..." : "Place order"} <span aria-hidden="true">→</span></button>
          <p className="cart-summary__note">Your final total is calculated securely by CafeServe.</p>
          <Link className="cart-back-link" to="/cart">← Back to cart</Link>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;
