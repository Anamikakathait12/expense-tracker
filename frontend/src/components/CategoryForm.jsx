import { useState } from "react";
import { createCategory, updateCategory } from "../api/categories";
import getErrorMessage from "../utils/getErrorMessage";

export default function CategoryForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "expense",
    color: initial?.color || "#6366f1",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (initial) await updateCategory(initial._id, form);
      else await createCategory(form);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required maxLength={30} value={form.name} onChange={handleChange} />
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="color">Colour</label>
          <div className="color-row">
            <input id="color" name="color" type="color" className="color-input"
                   value={form.color} onChange={handleChange} />
            <span className="muted">{form.color}</span>
          </div>
        </div>
      </div>

      {initial && (
        <p className="hint">A category that has transactions can't change its type.</p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Add category"}
        </button>
      </div>
    </form>
  );
}