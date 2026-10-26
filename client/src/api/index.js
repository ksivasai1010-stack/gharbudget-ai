import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Clear auth state
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const message = error.response?.data?.error?.message || error.message || 'Network error';
    const code = error.response?.data?.error?.code || 'UNKNOWN';
    return Promise.reject({ message, code, fields: error.response?.data?.error?.fields, status: error.response?.status });
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

// ── Families ──────────────────────────────────────────────────────────────────
export const familiesAPI = {
  create: (data) => api.post('/families', data),
  getCurrent: () => api.get('/families/current'),
  update: (data) => api.patch('/families/current', data),
  inviteMember: (data) => api.post('/families/current/members', data),
  updateMember: (id, data) => api.patch(`/families/current/members/${id}`, data),
  removeMember: (id) => api.delete(`/families/current/members/${id}`),
};

// ── Income ────────────────────────────────────────────────────────────────────
export const incomeAPI = {
  getAll: () => api.get('/income'),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.patch(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  parse: (text) => api.post('/expenses/parse', { text }),
};

// ── Budgets ───────────────────────────────────────────────────────────────────
export const budgetsAPI = {
  get: (month) => api.get(`/budgets/${month}`),
  update: (month, data) => api.put(`/budgets/${month}`, data),
  summary: (month) => api.get(`/budgets/${month}/summary`),
};

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goalsAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  get: (id) => api.get(`/goals/${id}`),
  update: (id, data) => api.patch(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  contribute: (id, amount) => api.post(`/goals/${id}/contribute`, { amount }),
  getPlan: (id) => api.get(`/goals/${id}/plan`),
};

// ── Loans ─────────────────────────────────────────────────────────────────────
export const loansAPI = {
  getAll: () => api.get('/loans'),
  create: (data) => api.post('/loans', data),
  get: (id) => api.get(`/loans/${id}`),
  update: (id, data) => api.patch(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`),
  summary: () => api.get('/loans/summary'),
  calculateEmi: (data) => api.post('/loans/emi-calculator', data),
};

// ── Reminders ─────────────────────────────────────────────────────────────────
export const remindersAPI = {
  getAll: () => api.get('/reminders'),
  upcoming: (days) => api.get('/reminders/upcoming', { params: { days } }),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.patch(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: (month) => api.get('/dashboard', { params: { month } }),
};

// ── Coach ─────────────────────────────────────────────────────────────────────
export const coachAPI = {
  chat: (message, month) => api.post('/coach/chat', { message }, { params: { month } }),
  history: () => api.get('/coach/history'),
  clearHistory: () => api.delete('/coach/history'),
  insights: (month) => api.get('/coach/insights', { params: { month } }),
};

// ── Education ─────────────────────────────────────────────────────────────────
export const educationAPI = {
  getLessons: (lang, category) => api.get('/lessons', { params: { lang, category } }),
  getLesson: (id, lang) => api.get(`/lessons/${id}`, { params: { lang } }),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
  aiStatus: () => api.get('/ai/status'),
};

export default api;
