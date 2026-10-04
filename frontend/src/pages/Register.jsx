import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";

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
    <div className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Create account</h2>

        {error && <div className="error">{error}</div>}

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

        <button className="btn" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>

        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}