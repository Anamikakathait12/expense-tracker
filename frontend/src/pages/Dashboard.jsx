import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { getSummary, getCompare, getByCategory, getMonthlyTrend } from "../api/analytics";
import { getBudgets } from "../api/budgets";
import { getTransactions } from "../api/transactions";
import MonthPicker from "../components/MonthPicker";
import { useAuth } from "../context/AuthContext";
import { useQuickAdd } from "../context/QuickAddContext";
import categoryIcon from "../utils/categoryIcon";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney, formatDate } from "../utils/format";
import { currentMonth, shortMonth } from "../utils/month";
import DemoGuide from "../components/DemoGuide";

const STATUS_LABEL = { ok: "On track", warning: "Warning", exceeded: "Exceeded" };

function readBalanceVisibility() {
  try {
    return window.sessionStorage.getItem("expense-tracker-balance-hidden") !== "true";
  } catch {
    return true;
  }
}

function BalanceChange({ change, goodWhen }) {
  if (!change || change.direction === "same") {
    return <span className="balance-change">No change vs last month</span>;
  }
  const arrow = change.direction === "up" ? "\u25B2" : "\u25BC";
  const text = change.percent === null ? "new this month" : `${Math.abs(change.percent)}%`;
  const good = change.direction === goodWhen;

  return (
    <span className={`balance-change ${good ? "is-good" : "is-bad"}`}>
      {arrow} {text} <span>vs last month</span>
    </span>
  );
}

function CategoryIconBadge({ category, className = "" }) {
  return (
    <span
      className={`icon-badge ${className}`.trim()}
      style={{ "--category-color": category.color }}
      aria-hidden="true"
    >
      {createElement(categoryIcon(category.icon), { size: 19, strokeWidth: 2 })}
    </span>
  );
}

function MiniTrend({ data, dataKey, id, stroke }) {
  return (
    <div className="mini-trend dashboard-stat-sparkline" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={1.25}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpendBudgetCard({ budget, money }) {
  const status = STATUS_LABEL[budget.status] || "On track";
  return (
    <article className={`spend-budget-card spend-budget-${budget.status || "ok"}`}>
      <div className="spend-budget-top">
        <span
          className="icon-badge"
          style={{ "--category-color": budget.category.color }}
          aria-hidden="true"
        >
          {createElement(categoryIcon(budget.category.icon), { size: 19 })}
        </span>
        <span className={`pill-tag budget-status ${budget.status || "ok"}`}>{status}</span>
      </div>
      <h3>{budget.category.name}</h3>
      <p className="spend-budget-amount">{money(budget.spent)} <span>/ {money(budget.limit)}</span></p>
      <div className="budget-progress" aria-label={`${budget.percentUsed}% of budget used`}>
        <span
          className={`budget-progress-fill ${budget.status || "ok"}`}
          style={{ width: `${Math.min(budget.percentUsed || 0, 100)}%` }}
        />
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { version } = useQuickAdd();
  const currency = user.currency || "INR";

  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balanceVisible, setBalanceVisible] = useState(readBalanceVisibility);

  useEffect(() => {
    let ignore = false;
    // This flag represents the start of the request for the selected month.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    Promise.all([
      getSummary(month),
      getCompare(month),
      getByCategory(month, "expense"),
      getBudgets(month),
    ])
      .then(([summary, compare, byCategory, budgetResult]) => {
        if (ignore) return;
        setData({
          summary: summary.data,
          compare: compare.data,
          byCategory: byCategory.data,
        });
        setBudgets(budgetResult.data.budgets);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [month, version]);

  useEffect(() => {
    let ignore = false;
    getMonthlyTrend(6)
      .then((res) => !ignore && setTrend(res.data.trend))
      .catch((err) => !ignore && setError(getErrorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [version]);

  useEffect(() => {
    getTransactions({ limit: 5, sort: "-date" })
      .then((res) => setRecent(res.data.transactions))
      .catch((err) => setError(getErrorMessage(err)));
  }, [version]);

  const money = (amount) => formatMoney(amount, currency);
  const categories = data?.byCategory.categories || [];
  const pieData = categories.map((category) => ({
    name: category.name,
    total: category.total,
    fill: category.color,
  }));
  const trendData = trend.map((item) => ({ ...item, label: shortMonth(item.month) }));

  const toggleBalance = () => {
    setBalanceVisible((visible) => {
      const nextVisible = !visible;
      try {
        window.sessionStorage.setItem("expense-tracker-balance-hidden", String(!nextVisible));
      } catch {
        // The toggle still works for this render when storage is unavailable.
      }
      return nextVisible;
    });
  };

  const balance = data?.summary.balance ?? 0;
  return (
    <div className="dashboard-page">
      {user.isDemo && <DemoGuide />}
      <section className="dashboard-header-zone dash-hero" aria-label="Monthly balance overview">
        <div className="dashboard-header-row">
          <div>
            <p className="dashboard-greeting">{user.username}</p>
          </div>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        <div className="dashboard-balance">
          <p className="dashboard-balance-label">Balance</p>
          <div className="dashboard-balance-line">
            <h1>{loading && !data ? "Loading..." : balanceVisible ? money(balance) : "••••••"}</h1>
            <button
              type="button"
              className="balance-visibility"
              onClick={toggleBalance}
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}
              aria-pressed={!balanceVisible}
            >
              {balanceVisible ? <Eye size={19} /> : <EyeOff size={19} />}
            </button>
          </div>
          <p className="dashboard-balance-subline">
            Income {money(data?.summary.income || 0)} <span>·</span> Expense {money(data?.summary.expense || 0)}
          </p>
          <span className="sr-only">
            Balance trend: {balance < 0 ? "Spending is ahead" : "You are in the green"}
          </span>
        </div>
      </section>

      {error && <div className="error dashboard-error" role="alert">{error}</div>}

      {!data ? (
        !error && <p className="empty">Loading...</p>
      ) : (
        <>
          <section className={`dashboard-stat-grid dash-stats ${loading ? "dim" : ""}`} aria-label="Monthly income and expense">
            <article className="dashboard-stat-card income-stat">
              <div className="dashboard-stat-heading">
                <span className="dashboard-stat-icon" aria-hidden="true"><ArrowDown size={17} /></span>
                <span>Income</span>
              </div>
              <p className="dashboard-stat-value">{money(data.summary.income)}</p>
              <BalanceChange change={data.compare.change.income} goodWhen="up" />
              <MiniTrend data={trendData} dataKey="income" id="income-spark-fill" stroke="var(--forest-700)" />
            </article>
            <article className="dashboard-stat-card expense-stat">
              <div className="dashboard-stat-heading">
                <span className="dashboard-stat-icon" aria-hidden="true"><ArrowUp size={17} /></span>
                <span>Expense</span>
              </div>
              <p className="dashboard-stat-value">{money(data.summary.expense)}</p>
              <BalanceChange change={data.compare.change.expense} goodWhen="down" />
              <MiniTrend data={trendData} dataKey="expense" id="expense-spark-fill" stroke="var(--orange)" />
            </article>
          </section>

          <div className="dashboard-sheet">
            <section className="dashboard-section" aria-labelledby="dashboard-budgets-title">
              <div className="dashboard-section-heading">
                <h2 id="dashboard-budgets-title">Budgets</h2>
                <Link to="/budgets">See all</Link>
              </div>
              {budgets.length === 0 ? (
                <div className="empty-state dashboard-budget-empty">
                  <p>No budgets for this month yet.</p>
                  <Link to="/budgets">Create a budget</Link>
                </div>
              ) : (
                <div className="scroll-row dashboard-budget-row">
                  {budgets.map((budget) => (
                    <SpendBudgetCard key={budget._id} budget={budget} money={money} />
                  ))}
                </div>
              )}
            </section>

            <div className="dashboard-lower-grid">
              <section className="dashboard-section category-panel" aria-labelledby="dashboard-category-title">
                <div className="dashboard-section-heading">
                  <h2 id="dashboard-category-title">Spending by category</h2>
                </div>
                {categories.length === 0 ? (
                  <p className="empty-state">No expenses this month.</p>
                ) : (
                  <>
                    <div className="dashboard-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="total"
                            nameKey="name"
                            innerRadius={66}
                            outerRadius={94}
                            paddingAngle={3}
                            cornerRadius={5}
                            stroke="none"
                            isAnimationActive={false}
                          />
                          <Tooltip formatter={(value) => money(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="dashboard-donut-total">
                        <span>Total spent</span>
                        <strong>{money(data.summary.expense)}</strong>
                      </div>
                    </div>
                    <div className="dashboard-category-legend">
                      {categories.map((category) => (
                        <div className="dashboard-legend-row" key={category.categoryId}>
                          <span className="dashboard-legend-name">
                            <span className="dot" style={{ background: category.color }} />
                            {category.name}
                          </span>
                          <span>{money(category.total)} <small>{category.percent}%</small></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="dashboard-section recent-panel" aria-labelledby="dashboard-recent-title">
                <div className="dashboard-section-heading">
                  <h2 id="dashboard-recent-title">Recent transactions</h2>
                  <Link to="/transactions">View all</Link>
                </div>
                {recent.length === 0 ? (
                  <p className="empty-state">No transactions yet.</p>
                ) : (
                  <div className="dashboard-recent-list">
                    {recent.map((transaction) => {
                      const income = transaction.type === "income";
                      return (
                        <div className="dashboard-recent-row" key={transaction._id}>
                          <CategoryIconBadge category={transaction.category} />
                          <span className="dashboard-recent-copy">
                            <strong>{transaction.category.name}</strong>
                            <small>
                              {formatDate(transaction.date)}
                              {transaction.note ? ` · ${transaction.note}` : ""}
                            </small>
                          </span>
                          <span className={`dashboard-recent-amount ${income ? "amount-income" : "amount-expense"}`}>
                            <span aria-hidden="true">{income ? "+" : "−"}</span>{money(transaction.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
