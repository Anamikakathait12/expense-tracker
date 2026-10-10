import { createElement, useState } from "react";
import { createBudget, updateBudget } from "../api/budgets";
import categoryIcon from "../utils/categoryIcon";
import getErrorMessage from "../utils/getErrorMessage";

export default function BudgetForm({ month, categories, initial, onSaved, onCancel }) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(initial ? String(initial.limit) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!initial && !category) {
      setError("Choose a category.");
      return;
    }
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
      {error && <div className="error" role="alert">{error}</div>}

      <div className="field">
        <label htmlFor="category">Category</label>
        {initial ? (
          <span className="category-chip selected category-chip-readonly">
            <span
              className="icon-badge"
              style={{ "--category-color": initial.category.color }}
              aria-hidden="true"
            >
              {createElement(categoryIcon(initial.category.icon), { size: 17 })}
            </span>
            {initial.category.name}
          </span>
        ) : (
          <>
            <div
              className="category-chip-group"
              role="radiogroup"
              aria-label="Budget category"
              aria-required="true"
              onKeyDown={(event) => {
                if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
                event.preventDefault();
                if (categories.length === 0) return;
                const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
                const currentIndex = categories.findIndex((item) => item._id === category);
                const nextIndex = currentIndex < 0
                  ? (direction > 0 ? 0 : categories.length - 1)
                  : (currentIndex + direction + categories.length) % categories.length;
                const nextCategory = categories[nextIndex];
                if (nextCategory) {
                  setCategory(nextCategory._id);
                  event.currentTarget.querySelector(`[data-category-id="${nextCategory._id}"]`)?.focus();
                }
              }}
            >
              {categories.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  role="radio"
                  aria-checked={category === item._id}
                  className={`category-chip${category === item._id ? " selected" : ""}`}
                  tabIndex={category === item._id || (!category && categories[0]?._id === item._id) ? 0 : -1}
                  style={{ "--category-color": item.color }}
                  data-category-id={item._id}
                  onClick={() => {
                    setError("");
                    setCategory(item._id);
                  }}
                >
                  <span className="icon-badge" aria-hidden="true">
                    {createElement(categoryIcon(item.icon), { size: 17 })}
                  </span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
            {!category && <span className="hint">Choose a category to continue.</span>}
          </>
        )}
      </div>

      <div className="field">
        <label htmlFor="limit">Monthly limit</label>
        <input id="limit" type="number" step="0.01" min="0.01" required
               value={limit} onChange={(e) => setLimit(e.target.value)} />
      </div>

      <div className="form-actions form-actions-primary">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Add budget"}
        </button>
      </div>
    </form>
  );
}