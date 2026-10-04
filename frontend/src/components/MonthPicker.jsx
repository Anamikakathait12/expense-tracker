import { currentMonth, shiftMonth, monthLabel } from "../utils/month";

export default function MonthPicker({ value, onChange, allowFuture = false }) {
  const now = currentMonth();

  return (
    <div className="month-picker">
      <button className="btn btn-outline btn-sm" onClick={() => onChange(shiftMonth(value, -1))}
              aria-label="Previous month">&lsaquo;</button>

      <span className="month-label">{monthLabel(value)}</span>

      <button className="btn btn-outline btn-sm" onClick={() => onChange(shiftMonth(value, 1))}
              disabled={!allowFuture && value >= now} aria-label="Next month">&rsaquo;</button>

      {value !== now && (
        <button className="btn btn-outline btn-sm" onClick={() => onChange(now)}>This month</button>
      )}
    </div>
  );
}