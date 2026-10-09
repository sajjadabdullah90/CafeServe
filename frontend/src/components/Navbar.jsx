import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">CafeServe</Link>
      <nav className="navbar__links" aria-label="Main navigation">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/orders">Orders</Link>
        {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
      </nav>
      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <span className="navbar__welcome">Hi, {user.name.split(" ")[0]}</span>
            <button className="navbar__login navbar__logout" type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : <Link to="/login" className="navbar__login">Login</Link>}
        <Link to="/cart" className="navbar__cart" aria-label={`Shopping cart, ${itemCount} items`}>
          Cart <span className="navbar__cart-count">{itemCount}</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
