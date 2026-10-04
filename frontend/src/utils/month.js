const pad = (n) => String(n).padStart(2, "0");

// "2026-10" for today
export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// "2026-10", -1 -> "2026-09"  (also handles year boundaries)
export const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// "2026-10" -> "October 2026"
export const monthLabel = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09" -> "Sep '26"  (short label for chart axes)
export const shortMonth = (month) =>
  `${NAMES[Number(month.slice(5, 7)) - 1]} '${month.slice(2, 4)}`;