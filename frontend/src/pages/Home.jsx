import { useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -28px 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="home home--luxury home--editorial">
      <section className="hero hero--luxury">
        <div className="hero__content">
          <p className="hero__eyebrow">GOOD FOOD, NO OCCASION NEEDED</p>
          <h1>Good taste.<br />Great <span>moments.</span></h1>
          <p className="hero__description">
            From a proper burger to a slow coffee break, find something worth
            looking forward to. Pick your favourites and order in a few simple steps.
          </p>
          <div className="hero__actions">
            <Link to="/menu" className="hero__button">Explore the menu <span aria-hidden="true">↗</span></Link>
            <Link to="/orders" className="hero__secondary-button">Already ordered? Track it <span aria-hidden="true">→</span></Link>
          </div>
          <p className="hero__small-note">A good meal can turn the day around.</p>
        </div>

        <div className="hero__visual hero__visual--luxury" aria-label="CafeServe food">
          <div className="hero__image-shell">
            <img
              className="hero__food-image"
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=90"
              alt="Gourmet burger with fresh lettuce, tomato and melted cheese"
              fetchPriority="high"
            />
            <div className="hero__image-shade" />
            <div className="hero__image-caption">
              <span><strong>Made for your appetite.</strong><small>Browse the menu and find your thing.</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-invitation" data-reveal>
        <div className="menu-invitation__heading">
          <p className="section-kicker">WHEN THE CRAVING HITS</p>
          <h2>There’s always<br />something <em>good.</em></h2>
        </div>
        <div className="menu-invitation__body">
          <p>
            Familiar favourites, comfort food and little treats for the in-between
            moments. Take a look around, choose what sounds good, and make it yours.
          </p>
          <Link to="/menu" className="text-link">See everything on the menu <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="food-editorial" data-reveal aria-label="Food at CafeServe">
        <Link to="/menu" className="food-editorial__image food-editorial__image--main" aria-label="Explore the CafeServe menu">
          <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=90" alt="Close-up of a freshly made burger" loading="lazy" />
          <span className="food-editorial__image-label">The comfort-food classic <span aria-hidden="true">↗</span></span>
        </Link>
        <div className="food-editorial__side">
          <Link to="/menu" className="food-editorial__image food-editorial__image--small">
            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85" alt="Pizza fresh from the oven" loading="lazy" />
            <span className="food-editorial__image-label">For sharing, or not <span aria-hidden="true">↗</span></span>
          </Link>
          <div className="food-editorial__note">
            <span className="food-editorial__note-number">01 — 02</span>
            <p>Something filling. Something to share. Something just for you.</p>
            <Link to="/menu" className="text-link">Find your next favourite <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="ordering-steps" id="how-it-works" data-reveal>
        <div className="ordering-steps__intro">
          <p className="section-kicker">FROM CRAVING TO CART</p>
          <h2>Good food.<br /><em>Few simple steps.</em></h2>
        </div>
        <ol className="ordering-steps__list ordering-steps__grid">
          <li><span>01</span><div><h3>Choose what you love</h3><p>Explore the menu at your own pace.</p></div></li>
          <li><span>02</span><div><h3>Place your order</h3><p>Add your picks to the cart and check out.</p></div></li>
          <li><span>03</span><div><h3>Follow your order</h3><p>Come back to check its progress.</p></div></li>
        </ol>
      </section>

      <section className="home-last-call" data-reveal>
        <div>
          <p className="section-kicker">YOUR TABLE, YOUR CALL</p>
          <h2>What are you<br /><em>in the mood for?</em></h2>
        </div>
        <Link to="/menu" className="hero__button">Find something delicious <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}

export default Home;
