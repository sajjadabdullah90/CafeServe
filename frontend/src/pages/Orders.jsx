import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatPrice(value) {
  return `Rs. ${Number(value).toLocaleString("en-PK")}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function readableStatus(status) {
  return String(status || "PENDING").toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function Orders() {
  const { token, isAuthenticated } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const controller = new AbortController();
    async function loadOrders() {
      setStatus("loading");
      setError("");
      try {
        const endpoint = id ? `${API_URL}/api/orders/${id}` : `${API_URL}/api/orders`;
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load your orders.");
        const data = id ? [result.data] : result.data;
        setOrders(Array.isArray(data) ? data : []);
        setStatus("success");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load your orders.");
          setStatus("error");
        }
      }
    }
    loadOrders();
    return () => controller.abort();
  }, [id, token, isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: id ? `/orders/${id}` : "/orders" }} />;

  return (
    <main className="orders-page">
      <section className="orders-intro">
        <span className="menu-eyebrow">{id ? "ORDER DETAILS" : "YOUR CAFE SERVE ACCOUNT"}</span>
        <h1>{id ? <>Order <span>#{id}.</span></> : <>Good food, <span>all in one place.</span></>}</h1>
        <p>{id ? "Here’s the latest information saved for this order." : "Track your orders and revisit the meals you’ve ordered."}</p>
      </section>
      {status === "loading" && <div className="menu-state" role="status"><span className="menu-spinner" /><h2>Loading your orders</h2><p>Getting the latest details from CafeServe.</p></div>}
      {status === "error" && <div className="menu-state" role="alert"><span className="menu-state__icon">!</span><h2>We couldn't load this page</h2><p>{error}</p><Link className="cart-primary-button" to="/menu">Back to menu</Link></div>}
      {status === "success" && orders.length === 0 && <section className="orders-empty"><span className="menu-eyebrow">NOTHING HERE JUST YET</span><h2>Your first order is waiting.</h2><p>When you place an order, you’ll find its status and details here.</p><Link className="cart-primary-button" to="/menu">Explore the menu</Link></section>}
      {status === "success" && orders.length > 0 && (
        <section className="orders-list" aria-label="Your orders">
          {location.state?.justPlaced && id && <div className="orders-success" role="status"><span>✓</span><div><strong>Order placed successfully</strong><p>Your order is saved. The cafe can now confirm and prepare it.</p></div></div>}
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card__top">
                <div><span className="order-card__eyebrow">ORDER #{order.id}</span><h2>{formatDate(order.createdAt)}</h2></div>
                <span className={`order-status order-status--${String(order.status).toLowerCase()}`}>{readableStatus(order.status)}</span>
              </div>
              <div className="order-card__items">
                {order.items.map((item) => <div className="order-card__item" key={item.id}><span>{item.quantity} × {item.menuItem?.name || "Menu item"}</span><strong>{formatPrice(Number(item.price) * item.quantity)}</strong></div>)}
              </div>
              <div className="order-card__bottom">
                <div><span>Delivery address</span><p>{order.deliveryAddress}</p><small>{order.phone}</small></div>
                <div className="order-card__total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
              </div>
              {!id && <Link className="order-card__link" to={`/orders/${order.id}`}>View order details <span aria-hidden="true">→</span></Link>}
              {id && <Link className="cart-back-link" to="/orders">← All orders</Link>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Orders;
