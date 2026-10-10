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

let jsPdfLoader;

function loadJsPdf() {
  if (!jsPdfLoader) {
    jsPdfLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-jspdf="true"]');
      if (existing && window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);

      const script = existing || document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";
      script.dataset.jspdf = "true";
      script.onload = () => {
        if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error("The PDF library loaded but was unavailable."));
      };
      script.onerror = () => reject(new Error("Could not load the PDF generator. Check your internet connection and try again."));
      if (!existing) document.head.appendChild(script);
    });
  }
  return jsPdfLoader;
}

async function downloadReceiptPdf(order) {
  const JsPDF = await loadJsPdf();
  const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 17;
  const contentWidth = pageWidth - margin * 2;
  const gold = [185, 143, 70];
  const ink = [36, 38, 42];
  const muted = [112, 116, 122];
  const pale = [248, 246, 241];
  const line = [229, 226, 219];
  let y = 18;

  const text = (value) => String(value ?? "—").replace(/[\\u0000-\\u001f]/g, " ").trim() || "—";
  const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
  const date = formatDate(order.createdAt);
  const orderNumber = text(order.id);
  const status = readableStatus(order.status).toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  function drawBrandHeader(pageLabel = "") {
    pdf.setFillColor(...ink);
    pdf.rect(0, 0, pageWidth, 43, "F");
    pdf.setFillColor(...gold);
    pdf.roundedRect(margin, 12, 17, 17, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text("CS", margin + 8.5, 22.5, { align: "center" });
    pdf.setFontSize(18);
    pdf.text("CafeServe", margin + 23, 19);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(221, 221, 221);
    pdf.text("FRESHLY PREPARED. THOUGHTFULLY SERVED.", margin + 23, 25);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(pageLabel || "ORDER RECEIPT", pageWidth - margin, 18, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(220, 220, 220);
    pdf.text(`ORDER #${orderNumber}`, pageWidth - margin, 25, { align: "right" });
  }

  function drawItemsHeader(atY) {
    pdf.setFillColor(...pale);
    pdf.roundedRect(margin, atY, contentWidth, 9, 1.5, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...muted);
    pdf.text("ITEM DESCRIPTION", margin + 3, atY + 5.8);
    pdf.text("QTY", 133, atY + 5.8, { align: "right" });
    pdf.text("UNIT PRICE", 158, atY + 5.8, { align: "right" });
    pdf.text("AMOUNT", pageWidth - margin - 3, atY + 5.8, { align: "right" });
    return atY + 9;
  }

  function newItemsPage() {
    pdf.addPage();
    drawBrandHeader("ORDER RECEIPT · CONTINUED");
    y = 54;
    y = drawItemsHeader(y);
  }

  function ensureSpace(requiredHeight, continuation = false) {
    if (y + requiredHeight > pageHeight - 24) {
      if (continuation) newItemsPage();
      else {
        pdf.addPage();
        drawBrandHeader("ORDER RECEIPT · CONTINUED");
        y = 55;
      }
    }
  }

  drawBrandHeader();
  y = 54;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(...ink);
  pdf.text("Order summary", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...muted);
  pdf.text(date, pageWidth - margin, y, { align: "right" });
  y += 8;

  const cardY = y;
  pdf.setFillColor(...pale);
  pdf.roundedRect(margin, cardY, contentWidth, 30, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...muted);
  pdf.text("CUSTOMER", margin + 5, cardY + 7);
  pdf.text("DELIVERY DETAILS", margin + contentWidth / 2 + 3, cardY + 7);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ink);
  const customerName = text(order.user?.name || "CafeServe customer");
  const customerEmail = text(order.user?.email || "—");
  const phone = text(order.phone || "—");
  const address = text(order.deliveryAddress || "—");
  pdf.text(pdf.splitTextToSize(customerName, contentWidth / 2 - 12).slice(0, 2), margin + 5, cardY + 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  pdf.text(pdf.splitTextToSize(customerEmail, contentWidth / 2 - 12).slice(0, 2), margin + 5, cardY + 19);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ink);
  pdf.text(pdf.splitTextToSize(phone, contentWidth / 2 - 12).slice(0, 1), margin + contentWidth / 2 + 3, cardY + 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  pdf.text(pdf.splitTextToSize(address, contentWidth / 2 - 12).slice(0, 2), margin + contentWidth / 2 + 3, cardY + 19);
  y = cardY + 38;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...ink);
  pdf.text("Items ordered", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  pdf.text(`Status: ${status}`, pageWidth - margin, y, { align: "right" });
  y += 6;
  y = drawItemsHeader(y);

  items.forEach((item, index) => {
    const name = text(item.menuItem?.name || "Menu item");
    const nameLines = pdf.splitTextToSize(name, 79).slice(0, 3);
    const rowHeight = Math.max(11, nameLines.length * 4.2 + 5);
    if (y + rowHeight > pageHeight - 24) newItemsPage();

    if (index % 2 === 1) {
      pdf.setFillColor(252, 251, 249);
      pdf.rect(margin, y, contentWidth, rowHeight, "F");
    }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...ink);
    pdf.text(nameLines, margin + 3, y + 5);
    pdf.text(String(Number(item.quantity || 0)), 133, y + 5, { align: "right" });
    pdf.text(money(item.price), 158, y + 5, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(money(Number(item.price || 0) * Number(item.quantity || 0)), pageWidth - margin - 3, y + 5, { align: "right" });
    pdf.setDrawColor(...line);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  });

  y += 8;
  ensureSpace(39);
  const totalLabelX = pageWidth - margin - 56;
  const totalValueX = pageWidth - margin - 3;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  pdf.text("Subtotal", totalLabelX, y);
  pdf.setTextColor(...ink);
  pdf.text(money(subtotal), totalValueX, y, { align: "right" });
  y += 7;
  pdf.setTextColor(...muted);
  pdf.text("Delivery", totalLabelX, y);
  pdf.setTextColor(...ink);
  pdf.text("Included", totalValueX, y, { align: "right" });
  y += 5;
  pdf.setDrawColor(...gold);
  pdf.setLineWidth(0.5);
  pdf.line(totalLabelX, y, totalValueX, y);
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...ink);
  pdf.text("TOTAL", totalLabelX, y);
  pdf.setTextColor(...gold);
  pdf.text(money(order.total), totalValueX, y, { align: "right" });

  const footerY = pageHeight - 18;
  pdf.setDrawColor(...line);
  pdf.setLineWidth(0.25);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...ink);
  pdf.text("Thank you for choosing CafeServe.", margin, footerY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...muted);
  pdf.text("Please keep this receipt for your records.", pageWidth - margin, footerY, { align: "right" });

  pdf.save(`CafeServe-Receipt-${orderNumber.replace(/[^a-zA-Z0-9-_]/g, "")}.pdf`);
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
                        await downloadReceiptPdf(order);
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
