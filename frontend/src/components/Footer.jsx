import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link to="/" className="site-footer__logo" aria-label="CafeServe home">
              <span className="site-footer__mark" aria-hidden="true">C</span>
              <span>Cafe<span>Serve</span></span>
            </Link>
            <p>Good food, thoughtfully served. Your next favourite bite is just around the corner.</p>
          </div>

          <nav className="site-footer__nav" aria-label="Footer navigation">
            <div>
              <h2>Explore</h2>
              <Link to="/">Home</Link>
              <Link to="/menu">Our Menu</Link>
              <Link to="/cart">Your Cart</Link>
            </div>
            <div>
              <h2>Your account</h2>
              <Link to="/orders">Track Orders</Link>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Create Account</Link>
            </div>
          </nav>
        </div>

        <div className="site-footer__bottom">
          <span>© {year} CafeServe. All rights reserved.</span>
          <span className="site-footer__made"><span aria-hidden="true">✦</span> Made for food lovers</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
