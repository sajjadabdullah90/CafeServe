import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function formatPrice(value) {
  return `Rs. ${Number(value).toLocaleString("en-PK")}`;
}

function Cart() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <main className="cart-page">
      <div className="cart-page__intro">
        <span className="menu-eyebrow">YOUR ORDER, YOUR WAY</span>
        <h1>Your <span>cart.</span></h1>
        <p>Take a look at your picks before we get them cooking.</p>
      </div>

      {items.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty__icon" aria-hidden="true">🛍️</div>
          <h2>Your cart is taking a little break</h2>
          <p>Find something delicious on the menu and it will show up here.</p>
          <Link className="cart-primary-button" to="/menu">Explore the menu</Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in your cart">
            <div className="cart-items__header">
              <div><h2>Your selection</h2><p>{itemCount} {itemCount === 1 ? "item" : "items"}</p></div>
              <button className="cart-text-button" type="button" onClick={clearCart}>Clear cart</button>
            </div>
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item__image">
                  {item.image ? <img src={item.image} alt={item.name} onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement.classList.add("cart-item__image--missing"); }} /> : <span aria-hidden="true">🍽️</span>}
                </div>
                <div className="cart-item__details">
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                  <strong>{formatPrice(item.price)}</strong>
                  <button className="cart-text-button cart-item__remove" type="button" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
                <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <strong className="cart-item__total">{formatPrice(item.price * item.quantity)}</strong>
              </article>
            ))}
            <Link className="cart-back-link" to="/menu">← Continue browsing</Link>
          </section>

          <aside className="cart-summary">
            <span className="cart-summary__eyebrow">THE BREAKDOWN</span>
            <h2>Order summary</h2>
            <div className="cart-summary__line"><span>Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}</span><strong>{formatPrice(subtotal)}</strong></div>
            <div className="cart-summary__line"><span>Delivery</span><span className="cart-summary__muted">Calculated at checkout</span></div>
            <div className="cart-summary__total"><span>Estimated total</span><strong>{formatPrice(subtotal)}</strong></div>
            <button className="cart-primary-button cart-primary-button--full" type="button" onClick={() => window.alert("Checkout is the next feature we will build.")}>Continue to checkout <span aria-hidden="true">→</span></button>
            <p className="cart-summary__note">Delivery charges, if applicable, will be confirmed at checkout.</p>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;
