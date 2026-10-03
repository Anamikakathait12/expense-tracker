const tz = () => process.env.APP_TIMEZONE || "Asia/Kolkata";

// How far ahead of UTC the timezone is at a given moment (in ms)
const offsetMs = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const localAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return localAsUTC - date.getTime();
};

// The exact UTC instant when a local month begins
const startOfMonth = (year, monthIndex) => {
  const guess = new Date(Date.UTC(year, monthIndex, 1));
  return new Date(guess.getTime() - offsetMs(guess, tz()));
};

// "2026-10" -> { start: 1 Oct 00:00 local, end: 1 Nov 00:00 local } as UTC dates
export const monthRange = (month) => {
  const [y, m] = month.split("-").map(Number);
  return { start: startOfMonth(y, m - 1), end: startOfMonth(y, m) };
};

// Current month as "2026-10", in the app timezone
export const currentMonth = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz(), year: "numeric", month: "2-digit" }).format(new Date());