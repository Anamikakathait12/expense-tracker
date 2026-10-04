import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getMonthlyTrend, getDaily, getTopExpenses } from "../api/analytics";
import MonthPicker from "../components/MonthPicker";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney, formatDate, formatCompact } from "../utils/format";
import { currentMonth, monthLabel, shortMonth } from "../utils/month";

const INCOME = "#22c55e";
const EXPENSE = "#ef4444";
const AXIS = "#9ca3af";

export default function Analytics() {
  const { user } = useAuth();
  const currency = user.currency || "INR";
  const money = (n) => formatMoney(n, currency);

  const [month, setMonth] = useState(currentMonth());
  const [months, setMonths] = useState(6);

  const [trend, setTrend] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [error, setError] = useState("");

  // Trend: depends only on the 6 / 12 toggle (it always ends at the current month)
  useEffect(() => {
    let ignore = false;
    setTrendLoading(true);

    getMonthlyTrend(months)
      .then((res) => !ignore && setTrend(res.data.trend))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setTrendLoading(false));

    return () => {
      ignore = true;
    };
  }, [months]);

  // Daily + top expenses: depend on the selected month
  useEffect(() => {
    let ignore = false;
    setMonthLoading(true);

    Promise.all([getDaily(month, "expense"), getTopExpenses(month, 5)])
      .then(([daily, top]) => {
        if (ignore) return;
        setMonthData({ days: daily.data.days, total: daily.data.total, top: top.data.expenses });
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setMonthLoading(false));

    return () => {
      ignore = true;
    };
  }, [month]);

  const trendData = (trend || []).map((t) => ({ ...t, label: shortMonth(t.month) }));
  const trendEmpty = trendData.every((t) => t.income === 0 && t.expense === 0);

  return (
    <>
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      {error && <div className="error">{error}</div>}

      {/* ---------- Trend over several months ---------- */}
      <div className="section-head">
        <h2>Last {months} months</h2>
        <div className="seg">
          {[6, 12].map((n) => (
            <button key={n} className={months === n ? "active" : ""} onClick={() => setMonths(n)}>
              {n} months
            </button>
          ))}
        </div>
      </div>

      {!trend ? (
        !error && <p className="empty">Loading...</p>
      ) : trendEmpty ? (
        <p className="empty">No transactions in this period.</p>
      ) : (
        <div className={`panels ${trendLoading ? "dim" : ""}`}>
          <div className="panel">
            <h3>Spending trend</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.3} />
                  <XAxis dataKey="label" stroke={AXIS} fontSize={12} />
                  <YAxis stroke={AXIS} fontSize={12} width={48} tickFormatter={formatCompact} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Line type="monotone" dataKey="expense" name="Expense"
                        stroke={EXPENSE} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h3>Income vs expense</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.3} />
                  <XAxis dataKey="label" stroke={AXIS} fontSize={12} />
                  <YAxis stroke={AXIS} fontSize={12} width={48} tickFormatter={formatCompact} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill={EXPENSE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Selected month ---------- */}
      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>{monthLabel(month)}</h2>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {!monthData ? (
        !error && <p className="empty">Loading...</p>
      ) : (
        <div className={`panels ${monthLoading ? "dim" : ""}`}>
          <div className="panel">
            <div className="panel-head">
              <h3>Daily spending</h3>
              <span className="muted">Total {money(monthData.total)}</span>
            </div>
            {monthData.total === 0 ? (
              <p className="empty">No expenses this month.</p>
            ) : (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.3} />
                    <XAxis dataKey="day" stroke={AXIS} fontSize={12} />
                    <YAxis stroke={AXIS} fontSize={12} width={48} tickFormatter={formatCompact} />
                    <Tooltip labelFormatter={(d) => `Day ${d}`} formatter={(v) => money(v)} />
                    <Bar dataKey="total" name="Spent" fill={EXPENSE} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Top expenses</h3>
            {monthData.top.length === 0 ? (
              <p className="empty">No expenses this month.</p>
            ) : (
              monthData.top.map((t, i) => (
                <div className="recent-row" key={t._id}>
                  <div className="rank-line">
                    <span className="rank">{i + 1}</span>
                    <div>
                      <div>
                        <span className="dot" style={{ background: t.category.color }} />
                        {t.category.name}
                      </div>
                      <div className="muted">
                        {formatDate(t.date)}{t.note ? ` \u00B7 ${t.note}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="amount-expense">{money(t.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}