import api from "./axios";

export const getSummary = (month) => api.get("/analytics/summary", { params: { month } });
export const getCompare = (month) => api.get("/analytics/compare", { params: { month } });
export const getByCategory = (month, type = "expense") =>
  api.get("/analytics/by-category", { params: { month, type } });

export const getMonthlyTrend = (months) =>
  api.get("/analytics/monthly-trend", { params: { months } });
export const getDaily = (month, type = "expense") =>
  api.get("/analytics/daily", { params: { month, type } });
export const getTopExpenses = (month, limit = 5) =>
  api.get("/analytics/top-expenses", { params: { month, limit } });