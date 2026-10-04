import { useState } from "react";
import { createBudget, updateBudget } from "../api/budgets";
import getErrorMessage from "../utils/getErrorMessage";

export default function BudgetForm({ month, categories, initial, onSaved, onCancel }) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(initial ? String(initial.limit) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (initial) {
        // only the limit can change. To budget another category or month, add a new budget
        await updateBudget(initial._id, { limit: Number(limit) });
      } else {
        await createBudget({ category, month, limit: Number(limit) });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // adding, but every expense category already has a budget this month
  if (!initial && categories.length === 0) {
    return (
      <>
        <p className="muted">Every expense category already has a budget for this month.</p>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={onCancel}>Close</button>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <div className="field">
        <label htmlFor="category">Category</label>
        {initial ? (
          <input id="category" value={initial.category.name} disabled />
        ) : (
          <select id="category" required value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="field">
        <label htmlFor="limit">Monthly limit</label>
        <input id="limit" type="number" step="0.01" min="0.01" required
               value={limit} onChange={(e) => setLimit(e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Add budget"}
        </button>
      </div>
    </form>
  );
}