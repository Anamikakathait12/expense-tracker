import { createElement, useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Pencil, Trash2 } from "lucide-react";
import { getBudgets, deleteBudget } from "../api/budgets";
import { getCategories } from "../api/categories";
import { getByCategory } from "../api/analytics";
import MonthPicker from "../components/MonthPicker";
import Modal from "../components/Modal";
import BudgetForm from "../components/BudgetForm";
import { useAuth } from "../context/AuthContext";
import { useQuickAdd } from "../context/QuickAddContext";
import categoryIcon from "../utils/categoryIcon";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney } from "../utils/format";
import { currentMonth, monthLabel } from "../utils/month";

const STATUS_LABEL = { ok: "On track", warning: "Warning", exceeded: "Exceeded" };
const CARD_TONES = ["budget-tone-yellow", "budget-tone-forest", "budget-tone-cyan"];

const statusText = (budget, money) => {
  if (budget.remaining < 0) return `Over budget by ${money(Math.abs(budget.remaining))}`;
  if (budget.remaining === 0) return "Budget fully used";
  if (budget.status === "warning") return `Almost there: ${money(budget.remaining)} left`;
  return `${money(budget.remaining)} left`;
};

export default function Budgets() {
  const { user } = useAuth();
  const { version } = useQuickAdd();
  const currency = user.currency || "INR";
  const money = (amount) => formatMoney(amount, currency);

  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState(null);
  const [categorySpending, setCategorySpending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState({ open: false, budget: null });

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    let ignore = false;
    // This flag represents the start of the request for the selected month.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    Promise.all([getBudgets(month), getByCategory(month, "expense")])
      .then(([budgetResponse, categoryResponse]) => {
        if (ignore) return;
        setBudgets(budgetResponse.data.budgets);
        setCategorySpending(categoryResponse.data.categories);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [month, reloadKey, version]);

  const closeModal = () => setModal({ open: false, budget: null });

  const handleSaved = () => {
    closeModal();
    setReloadKey((key) => key + 1);
  };

  const handleDelete = async (budget) => {
    if (!window.confirm(`Delete the ${budget.category.name} budget for ${monthLabel(month)}?`)) return;
    try {
      await deleteBudget(budget._id);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const available = categories.filter(
    (category) => category.type === "expense"
      && !(budgets || []).some((budget) => budget.category._id === category._id)
  );
  const totalLimit = (budgets || []).reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = (budgets || []).reduce((sum, budget) => sum + budget.spent, 0);
  const categoryPieData = categorySpending.map((category) => ({
    name: category.name,
    total: category.total,
    fill: category.color,
  }));

  return (
    <>
      <div className="page-header">
        <h1>Budgets</h1>
        <div className="header-actions">
          <MonthPicker value={month} onChange={setMonth} allowFuture />
          <button
            className="btn btn-primary budget-add-button"
            onClick={() => setModal({ open: true, budget: null })}
          >
            + New
          </button>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {!budgets ? (
        !error && <p className="empty">Loading...</p>
      ) : (
        <div className={loading ? "dim" : ""}>
          <section className="budget-spending-card" aria-labelledby="budget-spending-heading">
            <div className="budget-spending-copy">
              <p className="budget-spending-kicker">{monthLabel(month)}</p>
              <h2 id="budget-spending-heading">Spending overview</h2>
              <p className="budget-spending-total">
                {money(totalSpent)} <span>spent of {money(totalLimit)}</span>
              </p>
              <p className="budget-spending-count">
                Across {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
              </p>
            </div>

            {categorySpending.length > 0 ? (
              <div className="budget-spending-chart">
                <div className="budget-spending-donut">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={43}
                        outerRadius={61}
                        paddingAngle={3}
                        cornerRadius={4}
                        stroke="none"
                        isAnimationActive={false}
                      />
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="budget-category-legend" aria-label="Spending by category">
                  {categorySpending.map((category) => (
                    <li key={category.categoryId}>
                      <span className="budget-category-name">
                        <span className="dot" style={{ background: category.color }} />
                        {category.name}
                      </span>
                      <strong>{money(category.total)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="budget-chart-empty">
                {budgets.length
                  ? "No category spending recorded for this month."
                  : "No spending to chart yet."}
              </p>
            )}
          </section>

          {budgets.length === 0 ? (
            <div className="empty-state budgets-empty">
              <p>No budgets for {monthLabel(month)} yet.</p>
              <span>Add a budget to start tracking your spending.</span>
              <button
                className="btn btn-primary"
                onClick={() => setModal({ open: true, budget: null })}
              >
                Create a budget
              </button>
            </div>
          ) : (
            <section className="budget-list-section" aria-labelledby="budget-list-heading">
              <div className="budget-list-heading">
                <h2 id="budget-list-heading">Your budgets</h2>
                <span>{budgets.length} {budgets.length === 1 ? "category" : "categories"}</span>
              </div>
              <div className="budget-list">
                {budgets.map((budget, index) => {
                  const overBudget = budget.remaining < 0;
                  const description = overBudget
                    ? `Over by ${money(Math.abs(budget.remaining))}`
                    : `Spent ${money(budget.spent)}, ${money(budget.remaining)} left`;
                  const Icon = categoryIcon(budget.category.icon);
                  return (
                    <article
                      className={`budget-list-card ${CARD_TONES[index % CARD_TONES.length]}`}
                      key={budget._id}
                    >
                      <div className="budget-list-main">
                        <div className="budget-list-title-row">
                          <div className="budget-category-title">
                            <span className="budget-category-icon" aria-hidden="true">
                              {createElement(Icon, { size: 20 })}
                            </span>
                            <h3>{budget.category.name}</h3>
                          </div>
                          <strong className="budget-limit">{money(budget.limit)}</strong>
                        </div>
                        <p className="budget-description">{description}</p>
                        <p className="budget-status-message">{statusText(budget, money)}</p>
                        <div className="budget-list-meta">
                          <span className={`pill-tag budget-list-status ${budget.status || "ok"}`}>
                            {STATUS_LABEL[budget.status] || "On track"}
                          </span>
                          <span className="budget-percent">{budget.percentUsed}% used</span>
                        </div>
                        <div
                          className="budget-list-progress"
                          role="progressbar"
                          aria-label={`${budget.category.name} budget used`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={Math.min(budget.percentUsed || 0, 100)}
                        >
                          <span
                            className={`budget-list-progress-fill ${budget.status || "ok"}`}
                            style={{ width: `${Math.min(budget.percentUsed || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="budget-list-actions">
                        <button
                          className="budget-icon-action"
                          aria-label={`Edit ${budget.category.name} budget`}
                          onClick={() => setModal({ open: true, budget })}
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button
                          className="budget-icon-action"
                          aria-label={`Delete ${budget.category.name} budget`}
                          onClick={() => handleDelete(budget)}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
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
