import api from "./axios";

export const getBudgets = (month) => api.get("/budgets", { params: { month } });
export const createBudget = (data) => api.post("/budgets", data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);