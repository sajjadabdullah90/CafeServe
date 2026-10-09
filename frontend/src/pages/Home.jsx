import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow"><span className="hero__eyebrow-dot" /> Freshly prepared. Simply ordered.</p>
          <h1>Your next favourite <span>bite</span> starts here.</h1>
          <p className="hero__description">
            Big cravings, made easy. Explore the menu, find your go-to favourites,
            and place your order in just a few clicks.
          </p>
          <div className="hero__actions">
            <Link to="/menu" className="hero__button">Explore the menu <span aria-hidden="true">↗</span></Link>
            <a href="#how-it-works" className="hero__secondary-button">How it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero__trust-row" aria-label="CafeServe benefits">
            <span><span aria-hidden="true">✦</span> Made to order</span>
            <span><span aria-hidden="true">✦</span> Easy online ordering</span>
            <span><span aria-hidden="true">✦</span> Order tracking</span>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__visual-orbit hero__visual-orbit--one" />
          <div className="hero__visual-orbit hero__visual-orbit--two" />
          <div className="hero__image-shell">
            <img
              className="hero__food-image"
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=90"
              alt="Juicy gourmet burger with fresh lettuce, tomato, and melted cheese"
              fetchPriority="high"
            />
            <div className="hero__image-shade" />
            <div className="hero__image-caption">
              <span className="hero__caption-mark" aria-hidden="true">✦</span>
              <span><strong>Made for your cravings</strong><small>Good food, no fuss.</small></span>
            </div>
          </div>
          <div className="hero__floating-note">
            <span className="hero__floating-note-icon" aria-hidden="true">↗</span>
            <span><strong>Your next order</strong><small>Just a few clicks away</small></span>
          </div>
        </div>
      </section>

      <section className="features" id="how-it-works" aria-label="How CafeServe works">
        <article className="feature-card">
          <span className="feature-card__number">01 <span> / DISCOVER</span></span>
          <h2>Find your favourite.</h2>
          <p>Explore the menu and discover something worth coming back for.</p>
          <Link to="/menu" className="feature-card__link">Browse the menu <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="feature-card">
          <span className="feature-card__number">02 <span> / ORDER</span></span>
          <h2>Make it yours.</h2>
          <p>Add your picks to the cart and place your order with ease.</p>
          <Link to="/menu" className="feature-card__link">Build your order <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="feature-card">
          <span className="feature-card__number">03 <span> / ENJOY</span></span>
          <h2>Stay in the loop.</h2>
          <p>Check your order history and follow its progress after ordering.</p>
          <Link to="/orders" className="feature-card__link">Track an order <span aria-hidden="true">↗</span></Link>
        </article>
      </section>
    </main>
  );
}

export default Home;
