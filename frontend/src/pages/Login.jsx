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
      <aside className="auth-aside"><span>CAFE SERVE / YOUR TABLE AWAITS</span><div className="auth-aside__orb">✦</div><h2>Made fresh.<br />Made for you.</h2><p>Your next favourite is only a few clicks away.</p></aside>
    </main>
  );
}

export default Login;
