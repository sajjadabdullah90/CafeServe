import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="navbar">
      <Link to={isAdmin ? "/admin" : "/"} className="navbar__brand" onClick={closeMobileMenu}>CafeServe</Link>

      <button
        className="navbar__menu-toggle"
        type="button"
        aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMobileMenuOpen}
        aria-controls="cafeserve-main-navigation"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
      >
        <span aria-hidden="true">{isMobileMenuOpen ? "×" : "☰"}</span>
      </button>

      <nav
        id="cafeserve-main-navigation"
        className={`navbar__links${isMobileMenuOpen ? " navbar__links--open" : ""}`}
        aria-label="Main navigation"
        onClick={closeMobileMenu}
      >
        {isAdmin ? (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/menu">Menu Management</Link>
            <Link to="/admin/users">User Management</Link>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/menu">Menu</Link>
            {isAuthenticated && <Link to="/orders">Orders</Link>}
          </>
        )}
      </nav>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <span className="navbar__welcome">Hi, {user.name.split(" ")[0]}</span>
            <button className="navbar__login navbar__logout" type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login" className="navbar__login">Login</Link>
        )}

        {!isAdmin && (
          <Link to="/cart" className="navbar__cart" aria-label={`Shopping cart, ${itemCount} items`}>
            Cart <span className="navbar__cart-count">{itemCount}</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
