import api from "./axios";

export const getSummary = (month) => api.get("/analytics/summary", { params: { month } });
export const getCompare = (month) => api.get("/analytics/compare", { params: { month } });
export const getByCategory = (month, type = "expense") =>
  api.get("/analytics/by-category", { params: { month, type } });