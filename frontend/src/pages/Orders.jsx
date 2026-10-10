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

let html2pdfLoader;

function loadHtml2Pdf() {
  if (!html2pdfLoader) {
    html2pdfLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-html2pdf="true"]');
      if (existing && window.html2pdf) return resolve(window.html2pdf);

      const script = existing || document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.3/dist/html2pdf.bundle.min.js";
      script.async = true;
      script.dataset.html2pdf = "true";
      script.onload = () => window.html2pdf ? resolve(window.html2pdf) : reject(new Error("PDF tool did not load."));
      script.onerror = () => reject(new Error("PDF tool couldn't load. Check your internet connection and try again."));
      if (!existing) document.head.appendChild(script);
    }).catch((error) => {
      html2pdfLoader = null;
      throw error;
    });
  }
  return html2pdfLoader;
}

async function downloadReceiptPdf(orderId) {
  const receipt = document.querySelector(".receipt-print-area");
  if (!receipt) throw new Error("Receipt is not ready yet.");

  const html2pdf = await loadHtml2Pdf();
  document.body.classList.add("receipt-pdf-export");
  try {
    await document.fonts?.ready;
    await html2pdf()
      .set({
        margin: [10, 10, 12, 10],
        filename: `CafeServe-Receipt-${orderId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollY: 0 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(receipt)
      .save();
  } finally {
    document.body.classList.remove("receipt-pdf-export");
  }
}

function Orders() {
  const { token, isAuthenticated } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [receiptMessage, setReceiptMessage] = useState("");
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

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
              {!id && (
                <>
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
                </>
              )}
              {id && (
                <div className="receipt-actions">
                  <button
                    className="receipt-print-button"
                    type="button"
                    disabled={downloadingReceipt}
                    onClick={async () => {
                      setDownloadingReceipt(true);
                      setReceiptMessage("");
                      try {
                        await downloadReceiptPdf(order.id);
                      } catch (pdfError) {
                        setReceiptMessage(pdfError.message || "Could not create the PDF. Please try again.");
                      } finally {
                        setDownloadingReceipt(false);
                      }
                    }}
                  >
                    {downloadingReceipt ? "Creating PDF…" : "Download Receipt PDF"}
                  </button>
                  <p className="receipt-save-hint">Downloads a formatted PDF directly to your device.</p>
                  {receiptMessage && <p className="receipt-action-message" role="alert">{receiptMessage}</p>}
                  <Link className="cart-back-link" to="/orders">← All orders</Link>
                </div>
              )}
              {id && (
                <div className="receipt-print-area">
                  <div className="receipt-brand">
                    <span className="receipt-brand__mark">CS</span>
                    <div><strong>CafeServe</strong><span>FRESHLY MADE. THOUGHTFULLY SERVED.</span></div>
                    <span className="receipt-label">ORDER RECEIPT</span>
                  </div>
                  <div className="receipt-heading">
                    <div><span>RECEIPT FOR</span><h2>Order #{order.id}</h2><p>{formatDate(order.createdAt)}</p></div>
                    <span className={`receipt-status order-status order-status--${String(order.status).toLowerCase()}`}>{readableStatus(order.status)}</span>
                  </div>
                  <div className="receipt-customer-grid">
                    <div><span>CUSTOMER</span><strong>{order.user?.name || "CafeServe customer"}</strong><p>{order.user?.email || "—"}</p></div>
                    <div><span>DELIVERY DETAILS</span><strong>{order.phone || "—"}</strong><p>{order.deliveryAddress || "—"}</p></div>
                  </div>
                  <div className="receipt-items">
                    <div className="receipt-table-heading"><span>ITEM DESCRIPTION</span><span>QTY</span><span>UNIT PRICE</span><span>AMOUNT</span></div>
                    {order.items.map((item) => (
                      <div className="receipt-table-row" key={item.id}>
                        <strong>{item.menuItem?.name || "Menu item"}</strong>
                        <span>{item.quantity}</span>
                        <span>{formatPrice(item.price)}</span>
                        <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="receipt-totals">
                    <div><span>Subtotal</span><strong>{formatPrice(order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0))}</strong></div>
                    <div><span>Delivery</span><strong>Included</strong></div>
                    <div className="receipt-grand-total"><span>Total paid / due</span><strong>{formatPrice(order.total)}</strong></div>
                  </div>
                  <div className="receipt-footer">
                    <strong>Thank you for choosing CafeServe.</strong>
                    <p>Please keep this receipt for your records. This receipt reflects the order details currently saved in CafeServe.</p>
                    <span>ORDER #{order.id} · {formatDate(order.createdAt)}</span>
                  </div>
                </div>
              )}
              {!id && <Link className="order-card__link" to={`/orders/${order.id}`}>View order details <span aria-hidden="true">→</span></Link>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Orders;
