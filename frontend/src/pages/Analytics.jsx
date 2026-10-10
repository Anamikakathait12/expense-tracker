import { createElement, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMonthlyTrend, getDaily, getTopExpenses } from "../api/analytics";
import MonthPicker from "../components/MonthPicker";
import { useAuth } from "../context/AuthContext";
import { useQuickAdd } from "../context/QuickAddContext";
import categoryIcon from "../utils/categoryIcon";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney, formatDate, formatCompact } from "../utils/format";
import { currentMonth, monthLabel, shortMonth } from "../utils/month";

const SERIES_COLORS = {
  income: "var(--forest-700)",
  expense: "var(--yellow-ink)",
  daily: "var(--cyan)",
};

function FinanceTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="finance-chart-tooltip">
      {label && <p className="finance-chart-tooltip-label">{label}</p>}
      {payload.map((entry) => (
        <div className="finance-chart-tooltip-row" key={entry.dataKey}>
          <span>
            <i style={{ backgroundColor: entry.color }} />
            {entry.name || entry.dataKey}
          </span>
          <strong>{formatMoney(Number(entry.value) || 0, currency)}</strong>
        </div>
      ))}
    </div>
  );
}

function ChartAxes({ compact = true }) {
  return (
    <>
      <CartesianGrid
        vertical={false}
        stroke="var(--chart-grid)"
        strokeDasharray="4 5"
      />
      <XAxis
        dataKey="label"
        stroke="var(--chart-axis)"
        fontSize={11}
        tickLine={false}
        axisLine={false}
        minTickGap={14}
      />
      <YAxis
        stroke="var(--chart-axis)"
        fontSize={10}
        width={42}
        tickLine={false}
        axisLine={false}
        tickFormatter={compact ? formatCompact : undefined}
      />
    </>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const { version } = useQuickAdd();
  const currency = user.currency || "INR";
  const money = (amount) => formatMoney(amount, currency);

  const [month, setMonth] = useState(currentMonth());
  const [months, setMonths] = useState(6);

  const [trend, setTrend] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    // This flag represents the start of the request for the selected range.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrendLoading(true);

    getMonthlyTrend(months)
      .then((res) => !ignore && setTrend(res.data.trend))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setTrendLoading(false));

    return () => {
      ignore = true;
    };
  }, [months, version]);

  useEffect(() => {
    let ignore = false;
    // This flag represents the start of the request for the selected month.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [month, version]);

  const trendData = (trend || []).map((item) => ({ ...item, label: shortMonth(item.month) }));
  const trendEmpty = trendData.every((item) => item.income === 0 && item.expense === 0);
  const dailyData = (monthData?.days || []).map((day) => ({ ...day, label: day.day }));

  return (
    <>
      <div className="page-header analytics-page-header">
        <h1>Analytics</h1>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <section className="analytics-trend-section" aria-labelledby="analytics-trend-heading">
        <div className="analytics-section-heading">
          <div>
            <p className="analytics-eyebrow">Your patterns</p>
            <h2 id="analytics-trend-heading">Monthly overview</h2>
          </div>
          <div className="segmented" role="group" aria-label="Trend range">
            {[6, 12].map((count) => (
              <button
                key={count}
                type="button"
                className={months === count ? "active" : ""}
                aria-pressed={months === count}
                onClick={() => setMonths(count)}
              >
                {count}M
              </button>
            ))}
          </div>
        </div>

        {!trend ? (
          !error && <p className="empty-state analytics-empty">Loading trend...</p>
        ) : trendEmpty ? (
          <p className="empty-state analytics-empty">No transactions in this period.</p>
        ) : (
          <div className={`analytics-chart-grid ${trendLoading ? "dim" : ""}`}>
            <section className="panel analytics-panel" aria-labelledby="trend-chart-title">
              <div className="analytics-panel-heading">
                <h3 id="trend-chart-title">Spending trend</h3>
                <span className="chart-key"><i className="chart-key-dot expense-key" /> Expense</span>
              </div>
              <div className="chart-box analytics-trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analytics-expense-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--yellow)" stopOpacity={0.62} />
                        <stop offset="100%" stopColor="var(--yellow)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <ChartAxes />
                    <Tooltip
                      content={<FinanceTooltip currency={currency} />}
                      cursor={{ stroke: "var(--chart-grid)", strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke={SERIES_COLORS.income}
                      strokeWidth={3}
                      fill="url(#analytics-expense-gradient)"
                      activeDot={{ r: 5, fill: "var(--yellow)", stroke: "var(--forest-800)", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel analytics-panel" aria-labelledby="income-expense-title">
              <div className="analytics-panel-heading">
                <h3 id="income-expense-title">Income vs expense</h3>
              </div>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <ChartAxes />
                    <Tooltip
                      content={<FinanceTooltip currency={currency} />}
                      cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.35 }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                    />
                    <Bar dataKey="income" name="Income" fill={SERIES_COLORS.income} radius={[6, 6, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="expense" name="Expense" fill="var(--orange)" radius={[6, 6, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}
      </section>

      <div className="analytics-section-heading analytics-month-heading">
        <div>
          <p className="analytics-eyebrow">A closer look</p>
          <h2>{monthLabel(month)}</h2>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {!monthData ? (
        !error && <p className="empty-state analytics-empty">Loading monthly details...</p>
      ) : (
        <div className={`analytics-chart-grid ${monthLoading ? "dim" : ""}`}>
          <section className="panel analytics-panel" aria-labelledby="daily-chart-title">
            <div className="analytics-panel-heading">
              <h3 id="daily-chart-title">Daily spending</h3>
              <span className="analytics-total-label">Total {money(monthData.total)}</span>
            </div>
            {monthData.total === 0 ? (
              <p className="empty-state analytics-empty">No expenses this month.</p>
            ) : (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--chart-grid)"
                      strokeDasharray="4 5"
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--chart-axis)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      stroke="var(--chart-axis)"
                      fontSize={10}
                      width={42}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompact}
                    />
                    <Tooltip
                      content={<FinanceTooltip currency={currency} />}
                      labelFormatter={(day) => `Day ${day}`}
                      cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.35 }}
                    />
                    <Bar
                      dataKey="total"
                      name="Spent"
                      fill={SERIES_COLORS.daily}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="panel analytics-panel" aria-labelledby="top-expenses-title">
            <div className="analytics-panel-heading">
              <h3 id="top-expenses-title">Top expenses</h3>
              <span className="analytics-total-label">Top 5</span>
            </div>
            {monthData.top.length === 0 ? (
              <p className="empty-state analytics-empty">No expenses this month.</p>
            ) : (
              <div className="analytics-top-list">
                {monthData.top.map((transaction, index) => (
                  <div className="analytics-top-row" key={transaction._id}>
                    <span className="analytics-rank">{index + 1}</span>
                    <span
                      className="icon-badge analytics-category-icon"
                      style={{ "--category-color": transaction.category.color }}
                      aria-hidden="true"
                    >
                      {createElement(categoryIcon(transaction.category.icon), { size: 18 })}
                    </span>
                    <span className="analytics-top-copy">
                      <strong>{transaction.category.name}</strong>
                      <small>
                        {formatDate(transaction.date)}
                        {transaction.note ? ` · ${transaction.note}` : ""}
                      </small>
                    </span>
                    <strong className="analytics-top-amount">{money(transaction.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
