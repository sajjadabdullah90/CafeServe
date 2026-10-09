import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate(location.state?.from || "/menu", { replace: true });
    } catch (err) {
      setError(err.message || "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="menu-eyebrow">JOIN THE TABLE</span>
        <h1>Your next favourite <span>starts here.</span></h1>
        <p className="auth-panel__intro">Create an account to make ordering a little easier.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Full name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" minLength={2} maxLength={80} required /></label>
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} maxLength={72} required /></label>
          <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Type it again" minLength={8} maxLength={72} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="cart-primary-button cart-primary-button--full" type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create account"} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p>
      </section>
      <aside className="auth-aside">
        <span>CAFE SERVE / GOOD FOOD, GOOD MOOD</span>
        <div className="auth-aside__burger-scene" aria-hidden="true">
          <div className="auth-burger-glow" />
          <div className="auth-burger-ring auth-burger-ring--one" />
          <div className="auth-burger-ring auth-burger-ring--two" />
          <img className="auth-burger-image" src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=90" alt="" />
          <span className="auth-burger-note"><i /> HOUSE FAVOURITE <b>01</b></span>
        </div>
        <h2>A better way<br />to order.</h2>
        <p>Discover something delicious and let us take it from there.</p>
      </aside>
    </main>
  );
}

export default Register;
