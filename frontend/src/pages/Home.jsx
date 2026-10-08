function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Freshly prepared. Simply ordered.</p>
          <h1>Good food, made easy.</h1>
          <p className="hero__description">
            Discover your favorites, build your order, and enjoy a smoother
            restaurant experience with CafeServe.
          </p>
          <a href="/menu" className="hero__button">Explore Menu</a>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__glow" />
          <div className="hero__plate">🍽️</div>
        </div>
      </section>

      <section className="features">
        <article className="feature-card">
          <span>01</span>
          <h2>Browse</h2>
          <p>Explore the menu and find something you will love.</p>
        </article>
        <article className="feature-card">
          <span>02</span>
          <h2>Order</h2>
          <p>Add your favorites to the cart and place your order in seconds.</p>
        </article>
        <article className="feature-card">
          <span>03</span>
          <h2>Track</h2>
          <p>Follow your order from confirmation to completion.</p>
        </article>
      </section>
    </main>
  );
}

export default Home;
