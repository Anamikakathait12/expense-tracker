import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";
import DemoButton from "../components/DemoButton";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
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
        <p className="auth-eyebrow">Make it yours</p>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-description">A clearer picture of your money starts here.</p>

        {error && <div className="error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" required minLength={3}
                 value={form.username} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required
                 value={form.email} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={6}
                 value={form.password} onChange={handleChange} />
        </div>

        <button className="btn auth-submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>

        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
      <DemoButton label="Try the demo" className="btn auth-demo-button" />
    </main>
  );
}