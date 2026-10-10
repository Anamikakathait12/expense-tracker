import { createElement, useState } from "react";
import { createTransaction, updateTransaction } from "../api/transactions";
import categoryIcon from "../utils/categoryIcon";
import getErrorMessage from "../utils/getErrorMessage";
import { toDateInput } from "../utils/format";
import { PAYMENT_METHODS } from "../utils/constants";

export default function TransactionForm({ categories, initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    type: initial?.type || "expense",
    amount: initial ? String(initial.amount) : "",
    category: initial?.category?._id || "",
    date: toDateInput(initial?.date),
    note: initial?.note || "",
    paymentMethod: initial?.paymentMethod || "cash",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      // a category only fits one type, so changing type clears the choice
      ...(name === "type" ? { category: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.category) {
      setError("Choose a category.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount), // the API rejects numbers sent as text
        category: form.category,
        // noon local time, so the day stays correct across timezones
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        note: form.note,
        paymentMethod: form.paymentMethod,
      };

      if (initial) await updateTransaction(initial._id, payload);
      else await createTransaction(payload);

      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const options = categories.filter((c) => c.type === form.type);

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error" role="alert">{error}</div>}

      <div className="form-row">
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required
                 value={form.amount} onChange={handleChange} />
        </div>
      </div>

      <div className="form-row">
        <div className="field category-picker-field">
          <span className="field-label">Category</span>
          <div
            className="category-chip-group"
            role="radiogroup"
            aria-label="Category"
            aria-required="true"
            onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
              event.preventDefault();
              if (options.length === 0) return;
              const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
              const currentIndex = options.findIndex((category) => category._id === form.category);
              const nextIndex = currentIndex < 0
                ? (direction > 0 ? 0 : options.length - 1)
                : (currentIndex + direction + options.length) % options.length;
              const nextCategory = options[nextIndex];
              if (nextCategory) {
                setForm((current) => ({ ...current, category: nextCategory._id }));
                event.currentTarget.querySelector(`[data-category-id="${nextCategory._id}"]`)?.focus();
              }
            }}
          >
            {options.map((category) => (
              <button
                key={category._id}
                type="button"
                role="radio"
                aria-checked={form.category === category._id}
                className={`category-chip${form.category === category._id ? " selected" : ""}`}
                tabIndex={
                  form.category === category._id || (!form.category && options[0]?._id === category._id)
                    ? 0
                    : -1
                }
                style={{ "--category-color": category.color }}
                data-category-id={category._id}
                onClick={() => {
                  setError("");
                  setForm((current) => ({ ...current, category: category._id }));
                }}
              >
                <span className="icon-badge" aria-hidden="true">
                  {createElement(categoryIcon(category.icon), { size: 17 })}
                </span>
                <span>{category.name}</span>
              </button>
            ))}
            {options.length === 0 && <p className="muted category-picker-empty">No categories for this type.</p>}
          </div>
          {!form.category && <span className="hint">Choose a category to continue.</span>}
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" required value={form.date} onChange={handleChange} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="paymentMethod">Payment method</label>
        <select id="paymentMethod" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="note">Note</label>
        <input id="note" name="note" maxLength={200} value={form.note} onChange={handleChange} />
      </div>

      <div className="form-actions form-actions-primary">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}