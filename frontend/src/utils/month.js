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