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
        <div aria-hidden="true" style={{ position: "absolute", top: "12%", left: "50%", width: "min(78%, 340px)", aspectRatio: "1", transform: "translateX(-50%)", display: "grid", placeItems: "center", animation: "cs-float 5s ease-in-out infinite" }}>
          <div style={{ position: "absolute", inset: "2%", border: "1px solid rgba(233,184,115,.24)", borderRadius: "50%", transform: "rotate(-18deg) scaleY(.72)" }} />
          <div style={{ position: "absolute", inset: "12%", border: "1px dashed rgba(233,184,115,.18)", borderRadius: "50%", transform: "rotate(24deg) scaleY(.8)" }} />
          <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85" alt="" style={{ width: "72%", aspectRatio: "1", objectFit: "cover", borderRadius: "50%", border: "5px solid rgba(255,239,212,.12)", boxShadow: "0 20px 55px rgba(0,0,0,.45), 0 0 65px rgba(233,184,115,.2)" }} />
          <span style={{ position: "absolute", top: "18%", right: "0", padding: ".65rem .8rem", border: "1px solid rgba(233,184,115,.25)", borderRadius: "999px", background: "rgba(19,16,12,.88)", color: "#f0d4a8", fontSize: ".62rem", letterSpacing: ".12em" }}>FRESHLY MADE</span>
          <span style={{ position: "absolute", bottom: "18%", left: "0", padding: ".65rem .8rem", border: "1px solid rgba(233,184,115,.25)", borderRadius: "999px", background: "rgba(19,16,12,.88)", color: "#f0d4a8", fontSize: ".62rem", letterSpacing: ".12em" }}>BIG FLAVOUR</span>
          <span style={{ position: "absolute", top: "15%", left: "18%", width: "7px", height: "7px", borderRadius: "50%", background: "#f0d4a8", boxShadow: "0 0 18px #e9b873" }} />
          <span style={{ position: "absolute", bottom: "15%", right: "18%", width: "5px", height: "5px", borderRadius: "50%", background: "#f0d4a8", boxShadow: "0 0 16px #e9b873" }} />
        </div>
        <h2>A better way<br />to order.</h2>
        <p>Discover something delicious and let us take it from there.</p>
      </aside>
    </main>
  );
}

export default Register;
