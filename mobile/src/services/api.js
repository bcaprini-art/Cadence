/**
 * Cadence Mobile — Axios API Instance
 *
 * API_BASE_URL: Change this to your deployed server URL for production.
 * For local development with iOS Simulator, use 'http://localhost:4001/api'
 * For physical device on same Wi-Fi, use 'http://<your-mac-ip>:4001/api'
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://localhost:4001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach JWT from AsyncStorage
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('cadence_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Non-fatal: token unavailable
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['cadence_token', 'cadence_user']);
      // Navigation reset is handled by AuthContext listener
    }
    return Promise.reject(error);
  },
);

export default api;

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', {email, password}),
  register: data => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ── Schedule Blocks ─────────────────────────────────────
export const scheduleAPI = {
  getBlocks: params => api.get('/schedule-blocks', {params}),
  createBlock: data => api.post('/schedule-blocks', data),
  updateBlock: (id, data) => api.patch(`/schedule-blocks/${id}`, data),
  deleteBlock: id => api.delete(`/schedule-blocks/${id}`),
};

// ── Events ───────────────────────────────────────────────
export const eventsAPI = {
  getEvents: params => api.get('/events', {params}),
  getEvent: id => api.get(`/events/${id}`),
  createEvent: data => api.post('/events', data),
  updateEvent: (id, data) => api.patch(`/events/${id}`, data),
  deleteEvent: id => api.delete(`/events/${id}`),
  setVoluntary: (id, isVoluntary) =>
    api.patch(`/events/${id}/voluntary`, {isVoluntary}),
};

// ── Conflict Check ───────────────────────────────────────
export const conflictAPI = {
  check: data => api.post('/conflict-check', data),
  suggest: data => api.post('/conflict-check/suggest', data),
};

// ── Teams ────────────────────────────────────────────────
export const teamAPI = {
  getTeams: () => api.get('/teams'),
  getTeam: id => api.get(`/teams/${id}`),
};

// ── Compliance ───────────────────────────────────────────
export const complianceAPI = {
  getCARAHours: weekStart => api.get('/cara-log', {params: {weekStart}}),
  getAthleteCARA: (userId, weekStart) =>
    api.get(`/cara-log/${userId}`, {params: {weekStart}}),
  getSummary: (teamId, weekStart) =>
    api.get('/compliance/summary', {params: {teamId, weekStart}}),
  getForecast: (teamId, weekStart) =>
    api.get('/compliance/forecast', {params: {teamId, weekStart}}),
};

// ── Roster ───────────────────────────────────────────────
export const rosterAPI = {
  getRoster: teamId => api.get('/roster', {params: {teamId}}),
};
