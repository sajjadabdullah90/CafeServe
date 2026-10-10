import { Link } from "react-router-dom";

const signatureDishes = [
  {
    name: "Wood-fired pizza",
    category: "PIZZA & PASTA",
    image: "https://images.unsplash.com/photo-157 pizza",
  },
  {
    name: "Freshly brewed",
    category: "COFFEE & DESSERTS",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Signature pasta",
    category: "MADE TO SAVOUR",
    image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=700&q=85",
  },
];

function Home() {
  return (
    <main className="home home--luxury">
      <section className="hero hero--luxury">
        <div className="hero__content">
          <p className="hero__eyebrow"><span className="hero__eyebrow-dot" /> A little luxury, in every bite</p>
          <h1>Good taste.<br />Great <span>moments.</span></h1>
          <p className="hero__description">
            From indulgent burgers and oven-fresh pizza to comforting pasta and
            your favourite coffee — discover something made for your kind of craving.
          </p>
          <div className="hero__actions">
            <Link to="/menu" className="hero__button">Explore the menu <span aria-hidden="true">↗</span></Link>
            <a href="#how-it-works" className="hero__secondary-button">Discover CafeServe <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero__trust-row" aria-label="CafeServe benefits">
            <span><span aria-hidden="true">✦</span> Prepared with care</span>
            <span><span aria-hidden="true">✦</span> Simple online ordering</span>
            <span><span aria-hidden="true">✦</span> Track every order</span>
          </div>
        </div>

        <div className="hero__visual hero__visual--luxury" aria-label="CafeServe signature food selection">
          <div className="hero__visual-glow" />
          <div className="hero__image-shell">
            <img
              className="hero__food-image"
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=90"
              alt="Gourmet burger with fresh lettuce, tomato and melted cheese"
              fetchPriority="high"
            />
            <div className="hero__image-shade" />
            <div className="hero__image-caption">
              <span className="hero__caption-mark" aria-hidden="true">✦</span>
              <span><strong>The signature bite</strong><small>Big flavour. Beautifully simple.</small></span>
            </div>
          </div>
          <div className="hero__floating-note">
            <span className="hero__floating-note-icon" aria-hidden="true">✧</span>
            <span><strong>Made for the moment</strong><small>Your next favourite is waiting</small></span>
          </div>
          <div className="hero__side-image hero__side-image--pizza">
            <img src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=600&q=85" alt="Freshly baked pizza topped with cheese and herbs" loading="lazy" />
            <span>Pizza night</span>
          </div>
          <div className="hero__side-image hero__side-image--coffee">
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=85" alt="Freshly prepared cup of coffee" loading="lazy" />
            <span>Coffee break</span>
          </div>
        </div>
      </section>

      <section className="signature-strip" aria-label="Explore CafeServe favourites">
        <div className="signature-strip__heading">
          <span>CURATED FOR YOUR CRAVINGS</span>
          <h2>A favourite for every mood.</h2>
        </div>
        <div className="signature-strip__items">
          <article className="signature-tile">
            <img src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=85" alt="Pizza topped with cheese and herbs" loading="lazy" />
            <div><span>01 / FRESH FROM THE OVEN</span><h3>Pizza & pasta</h3></div>
          </article>
          <article className="signature-tile">
            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=85" alt="Juicy gourmet burger" loading="lazy" />
            <div><span>02 / THE CLASSIC CRAVING</span><h3>Gourmet burgers</h3></div>
          </article>
          <article className="signature-tile">
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=85" alt="Cup of freshly brewed coffee" loading="lazy" />
            <div><span>03 / YOUR LITTLE PAUSE</span><h3>Coffee & desserts</h3></div>
          </article>
        </div>
        <Link to="/menu" className="signature-strip__link">Find your favourite <span aria-hidden="true">↗</span></Link>
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
