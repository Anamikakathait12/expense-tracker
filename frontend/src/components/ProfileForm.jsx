import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";
import { CURRENCIES } from "../utils/constants";

export default function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const currentCurrency = user.currency || "INR";

  const [form, setForm] = useState({ username: user.username, currency: currentCurrency });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const unchanged = form.username === user.username && form.currency === currentCurrency;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await updateProfile(form);
      setSuccess("Profile updated");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" value={user.email} disabled />
      </div>

      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" required minLength={3}
               value={form.username} onChange={handleChange} />
      </div>

      <div className="field">
        <label htmlFor="currency">Currency</label>
        <select id="currency" name="currency" value={form.currency} onChange={handleChange}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <span className="hint">
          This changes the currency symbol only. Existing amounts are not converted.
        </span>
      </div>

      <button className="btn" disabled={submitting || unchanged}>
        {submitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}