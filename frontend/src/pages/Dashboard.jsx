import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { getSummary, getCompare, getByCategory } from "../api/analytics";
import { getTransactions } from "../api/transactions";
import MonthPicker from "../components/MonthPicker";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney, formatDate } from "../utils/format";
import { currentMonth } from "../utils/month";

// Shows "▲ 12.5% vs last month". goodWhen says which direction is good news:
// more income is good, more spending is not.
function Change({ change, goodWhen }) {
  if (!change || change.direction === "same") {
    return <span className="muted">No change vs last month</span>;
  }
  const arrow = change.direction === "up" ? "\u25B2" : "\u25BC";
  const text = change.percent === null ? "new this month" : `${Math.abs(change.percent)}%`;
  const good = change.direction === goodWhen;

  return (
    <span>
      <span className={good ? "change-good" : "change-bad"}>{arrow} {text}</span>{" "}
      <span className="muted">vs last month</span>
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user.currency || "INR";

  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Month-based data: reloads whenever the month changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    Promise.all([getSummary(month), getCompare(month), getByCategory(month, "expense")])
      .then(([summary, compare, byCategory]) => {
        if (ignore) return;
        setData({ summary: summary.data, compare: compare.data, byCategory: byCategory.data });
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [month]);

  // Recent transactions don't depend on the month, so they load once
  useEffect(() => {
    getTransactions({ limit: 5, sort: "-date" })
      .then((res) => setRecent(res.data.transactions))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const money = (n) => formatMoney(n, currency);
  const categories = data?.byCategory.categories || [];

  // Recharts reads the slice colour from the "fill" field of each item
  const pieData = categories.map((c) => ({ name: c.name, total: c.total, fill: c.color }));

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {error && <div className="error">{error}</div>}

      {!data ? (
        !error && <p className="empty">Loading...</p>
      ) : (
        <div className={loading ? "dim" : ""}>
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Income</div>
              <div className="stat-value amount-income">{money(data.summary.income)}</div>
              <div className="stat-note">
                <Change change={data.compare.change.income} goodWhen="up" />
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">Expense</div>
              <div className="stat-value amount-expense">{money(data.summary.expense)}</div>
              <div className="stat-note">
                <Change change={data.compare.change.expense} goodWhen="down" />
              </div>
            </div>

            <div className="stat">
              <div className="stat-label">Balance</div>
              <div className={`stat-value ${data.summary.balance < 0 ? "amount-expense" : ""}`}>
                {money(data.summary.balance)}
              </div>
              <div className="stat-note muted">
                {data.summary.transactionCount} transactions this month
              </div>
            </div>
          </div>

          <div className="panels">
            <div className="panel">
              <h3>Spending by category</h3>

              {categories.length === 0 ? (
                <p className="empty">No expenses this month.</p>
              ) : (
                <>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="total" nameKey="name"
                             innerRadius={60} outerRadius={95} paddingAngle={2} />
                        <Tooltip formatter={(value) => money(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {categories.map((c) => (
                    <div className="legend-row" key={c.categoryId}>
                      <span>
                        <span className="dot" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span>
                        {money(c.total)} <span className="muted">({c.percent}%)</span>
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Recent transactions</h3>
                <Link to="/transactions">View all</Link>
              </div>

              {recent.length === 0 ? (
                <p className="empty">No transactions yet.</p>
              ) : (
                recent.map((t) => (
                  <div className="recent-row" key={t._id}>
                    <div>
                      <div>
                        <span className="dot" style={{ background: t.category.color }} />
                        {t.category.name}
                      </div>
                      <div className="muted">
                        {formatDate(t.date)}{t.note ? ` \u00B7 ${t.note}` : ""}
                      </div>
                    </div>
                    <div className={t.type === "income" ? "amount-income" : "amount-expense"}>
                      {t.type === "income" ? "+" : "-"}{money(t.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}