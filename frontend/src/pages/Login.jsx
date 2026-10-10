import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";
import DemoButton from "../components/DemoButton";

export default function Login() {
  const { login, demoExpired } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError("");
    setSubmitting(true);
    try {
      await login(form);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <span className="auth-brand-mark" aria-hidden="true">E</span>
        <p className="auth-eyebrow">Welcome back</p>
        <h1 className="auth-title">Log in</h1>
        <p className="auth-description">Pick up where you left off with your finances.</p>

        {demoExpired && (
          <p className="demo-expired-notice" role="status">
            Your demo session has ended. Everything resets automatically. Start a new one anytime.
          </p>
        )}
        {error && <div className="error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required
                 value={form.email} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required
                 value={form.password} onChange={handleChange} />
        </div>

        <button className="btn auth-submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>

        <p className="muted">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
      <DemoButton label="Try the demo" className="btn auth-demo-button" />
    </main>
  );
}