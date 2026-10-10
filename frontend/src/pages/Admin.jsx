import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

function formatPrice(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function readableStatus(value) {
  return String(value || "").toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function Admin() {
  const { token, user, isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [metricsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard`, { headers }),
        fetch(`${API_URL}/api/admin/orders`, { headers }),
      ]);
      const [metricsResult, ordersResult] = await Promise.all([metricsResponse.json(), ordersResponse.json()]);
      if (!metricsResponse.ok) throw new Error(metricsResult.message || "Could not load dashboard.");
      if (!ordersResponse.ok) throw new Error(ordersResult.message || "Could not load orders.");
      setMetrics(metricsResult.data);
      setOrders(Array.isArray(ordersResult.data) ? ordersResult.data : []);
    } catch (err) {
      setError(err.message || "Could not load the admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === "ALL" || order.status === filter;
      const matchesSearch = !query || [
        String(order.id),
        order.user?.name,
        order.user?.email,
        order.phone,
        order.deliveryAddress,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [orders, filter, search]);

  async function updateStatus(orderId, status) {
    setUpdatingId(orderId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update order status.");
      setOrders((current) => current.map((order) => order.id === orderId ? result.data : order));
      setNotice(`Order #${orderId} updated to ${readableStatus(status)}.`);
      await loadMetricsOnly();
    } catch (err) {
      setError(err.message || "Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm(
      `Delete order #${orderId}? This permanently removes the order and its items and cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(orderId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not delete order.");

      setOrders((current) => current.filter((order) => order.id !== orderId));
      setNotice(result.message || `Order #${orderId} deleted.`);
      await loadMetricsOnly();
    } catch (err) {
      setError(err.message || "Could not delete order.");
    } finally {
      setDeletingId(null);
    }
  }

  async function loadMetricsOnly() {
    try {
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) setMetrics(result.data);
    } catch {
      // Keep the already visible order list if the metrics refresh fails.
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (user?.role !== "ADMIN") {
    return (
      <main className="admin-page">
        <section className="admin-empty">
          <span className="menu-eyebrow">RESTRICTED AREA</span>
          <h1>Admin access <span>required.</span></h1>
          <p>This dashboard is only available to CafeServe administrators.</p>
          <Link className="cart-primary-button" to="/">Return home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-intro">
        <div>
          <span className="menu-eyebrow">CAFESERVE OPERATIONS</span>
          <h1>Good service, <span>in control.</span></h1>
          <p>Monitor incoming orders and keep every table moving.</p>
        </div>
        <button className="admin-refresh" type="button" onClick={loadDashboard} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </section>

      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {notice && <div className="admin-alert" role="status">{notice}</div>}

      <section className="admin-metrics" aria-label="Restaurant overview">
        <article className="admin-metric"><span>Total orders</span><strong>{metrics?.totalOrders ?? "—"}</strong><small>All-time orders received</small></article>
        <article className="admin-metric"><span>Active orders</span><strong>{metrics?.activeOrders ?? "—"}</strong><small>Awaiting completion or cancellation</small></article>
        <article className="admin-metric"><span>Completed</span><strong>{metrics?.completedOrders ?? "—"}</strong><small>Successfully fulfilled orders</small></article>
        <article className="admin-metric admin-metric--revenue"><span>Completed sales</span><strong>{metrics ? formatPrice(metrics.completedRevenue) : "—"}</strong><small>Completed orders only</small></article>
      </section>

      <section className="admin-orders-panel">
        <div className="admin-orders-heading">
          <div><span className="menu-eyebrow">THE ORDER QUEUE</span><h2>Manage orders <span>{visibleOrders.length}</span></h2></div>
          <label className="admin-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, phone…" aria-label="Search orders" /></label>
        </div>
        <div className="admin-filters" aria-label="Filter orders by status">
          {["ALL", ...STATUSES].map((status) => (
            <button key={status} type="button" className={filter === status ? "admin-filter admin-filter--active" : "admin-filter"} onClick={() => setFilter(status)}>
              {status === "ALL" ? "All orders" : readableStatus(status)}
            </button>
          ))}
        </div>

        {loading && orders.length === 0 ? (
          <div className="admin-state"><span className="menu-spinner" /><h3>Loading the order queue</h3><p>Fetching the latest restaurant activity.</p></div>
        ) : !error && visibleOrders.length === 0 ? (
          <div className="admin-state"><h3>No orders match this view</h3><p>Try another status or search term.</p></div>
        ) : (
          <div className="admin-order-list">
            {visibleOrders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <div className="admin-order-card__top">
                  <div><span className="admin-order-number">ORDER #{order.id}</span><h3>{order.user?.name || "CafeServe customer"}</h3><p>{order.user?.email || "No email available"} · {formatDate(order.createdAt)}</p></div>
                  <span className={`order-status order-status--${String(order.status).toLowerCase()}`}>{readableStatus(order.status)}</span>
                </div>
                <div className="admin-order-card__details">
                  <div><span>Items</span><p>{order.items.map((item) => `${item.quantity} × ${item.menuItem?.name || "Menu item"}`).join(", ")}</p></div>
                  <div><span>Delivery</span><p>{order.deliveryAddress}</p><small>{order.phone}</small></div>
                  <div className="admin-order-total"><span>Order total</span><strong>{formatPrice(order.total)}</strong></div>
                </div>
                <div className="admin-order-card__actions">
                  <label>Update status
                    <select value={order.status} disabled={updatingId === order.id} onChange={(event) => updateStatus(order.id, event.target.value)}>
                      {STATUSES.map((status) => <option value={status} key={status}>{readableStatus(status)}</option>)}
                    </select>
                  </label>
                  <div className="admin-order-card__action-links">
                    <Link to={`/orders/${order.id}`} className="admin-view-link">View order →</Link>
                    <button
                      type="button"
                      className="admin-delete-order"
                      onClick={() => deleteOrder(order.id)}
                      disabled={deletingId === order.id || updatingId === order.id}
                    >
                      {deletingId === order.id ? "Deleting…" : "Delete order"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Admin;
