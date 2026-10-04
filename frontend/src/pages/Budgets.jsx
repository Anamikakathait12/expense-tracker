import { useEffect, useState } from "react";
import { getBudgets, deleteBudget } from "../api/budgets";
import { getCategories } from "../api/categories";
import MonthPicker from "../components/MonthPicker";
import Modal from "../components/Modal";
import BudgetForm from "../components/BudgetForm";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney } from "../utils/format";
import { currentMonth, monthLabel } from "../utils/month";

const STATUS_LABEL = { ok: "On track", warning: "Warning", exceeded: "Exceeded" };

const statusText = (b, money) => {
  if (b.remaining < 0) return `Over budget by ${money(Math.abs(b.remaining))}`;
  if (b.remaining === 0) return "Budget fully used";
  if (b.status === "warning") return `Almost there: ${money(b.remaining)} left`;
  return `${money(b.remaining)} left`;
};

export default function Budgets() {
  const { user } = useAuth();
  const currency = user.currency || "INR";
  const money = (n) => formatMoney(n, currency);

  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState({ open: false, budget: null });

  // Categories load once
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  // Budgets reload when the month changes or after add / edit / delete
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    getBudgets(month)
      .then((res) => !ignore && setBudgets(res.data.budgets))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [month, reloadKey]);

  const closeModal = () => setModal({ open: false, budget: null });

  const handleSaved = () => {
    closeModal();
    setReloadKey((k) => k + 1);
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete the ${b.category.name} budget for ${monthLabel(month)}?`)) return;
    try {
      await deleteBudget(b._id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // expense categories that don't have a budget yet this month
  const available = categories.filter(
    (c) => c.type === "expense" && !(budgets || []).some((b) => b.category._id === c._id)
  );

  const totalLimit = (budgets || []).reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = (budgets || []).reduce((sum, b) => sum + b.spent, 0);

  return (
    <>
      <div className="page-header">
        <h1>Budgets</h1>
        <div className="header-actions">
          <MonthPicker value={month} onChange={setMonth} allowFuture />
          <button className="btn" onClick={() => setModal({ open: true, budget: null })}>
            + Add budget
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {!budgets ? (
        !error && <p className="empty">Loading...</p>
      ) : budgets.length === 0 ? (
        <p className="empty">No budgets for {monthLabel(month)} yet. Add one to start tracking.</p>
      ) : (
        <div className={loading ? "dim" : ""}>
          <p className="muted">
            Spent {money(totalSpent)} of {money(totalLimit)} budgeted across {budgets.length}{" "}
            {budgets.length === 1 ? "category" : "categories"}.
          </p>

          <div className="budget-grid">
            {budgets.map((b) => (
              <div className="budget-card" key={b._id}>
                <div className="budget-top">
                  <div>
                    <span className="dot" style={{ background: b.category.color }} />
                    <strong>{b.category.name}</strong>
                  </div>
                  <span className={`badge ${b.status}`}>{STATUS_LABEL[b.status]}</span>
                </div>

                <div className="bar">
                  <div className={`bar-fill ${b.status}`}
                       style={{ width: `${Math.min(b.percentUsed, 100)}%` }} />
                </div>

                <div className="budget-nums">
                  <span>{money(b.spent)} of {money(b.limit)}</span>
                  <span>{b.percentUsed}%</span>
                </div>

                <div className={`budget-msg ${b.status}`}>{statusText(b, money)}</div>

                <div className="row-actions">
                  <button className="btn btn-outline btn-sm"
                          onClick={() => setModal({ open: true, budget: b })}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal.open && (
        <Modal
          title={modal.budget ? `Edit ${modal.budget.category.name} budget` : `Add budget for ${monthLabel(month)}`}
          onClose={closeModal}
        >
          <BudgetForm
            month={month}
            categories={available}
            initial={modal.budget}
            onSaved={handleSaved}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}