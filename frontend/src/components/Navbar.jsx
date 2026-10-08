import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">CafeServe</Link>

      <nav className="navbar__links" aria-label="Main navigation">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/orders">Orders</Link>
      </nav>

      <div className="navbar__actions">
        <Link to="/login" className="navbar__login">Login</Link>
        <Link to="/cart" className="navbar__cart" aria-label="Shopping cart">
          Cart
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
