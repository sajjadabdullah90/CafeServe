import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/menu", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="menu-eyebrow">WELCOME BACK</span>
        <h1>Good to have <span>you back.</span></h1>
        <p className="auth-panel__intro">Sign in to keep your favourites close and your orders in one place.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="cart-primary-button cart-primary-button--full" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New to CafeServe? <Link to="/register" state={location.state}>Create an account</Link></p>
      </section>
      <aside className="auth-aside">
        <span>CAFE SERVE / YOUR TABLE AWAITS</span>
        <div className="auth-aside__food-scene" aria-hidden="true">
          <div className="auth-food-orbit auth-food-orbit--outer" />
          <div className="auth-food-orbit auth-food-orbit--inner" />
          <div className="auth-food-image-wrap"><img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85" alt="" /></div>
          <span className="auth-food-tag auth-food-tag--fresh">FRESHLY MADE <i /></span>
          <span className="auth-food-tag auth-food-tag--flavour">BIG FLAVOUR <i /></span>
          <span className="auth-food-spark auth-food-spark--one" />
          <span className="auth-food-spark auth-food-spark--two" />
          <span className="auth-food-spark auth-food-spark--three" />
        </div>
        <h2>Made fresh.<br />Made for you.</h2>
        <p>Your next favourite is only a few clicks away.</p>
      </aside>
    </main>
  );
}

export default Login;
