import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cadence_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cadence_token');
      localStorage.removeItem('cadence_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Schedule blocks — routes match backend /api/schedule-blocks
export const scheduleAPI = {
  getBlocks: (params) => api.get('/schedule-blocks', { params }),
  createBlock: (data) => api.post('/schedule-blocks', data),
  updateBlock: (id, data) => api.patch(`/schedule-blocks/${id}`, data),
  deleteBlock: (id) => api.delete(`/schedule-blocks/${id}`),
};

// Events — routes match backend /api/events
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.patch(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  setVoluntary: (id, isVoluntary) => api.patch(`/events/${id}/voluntary`, { isVoluntary }),
};

// Conflict check — POST /api/conflict-check
export const conflictAPI = {
  check: (data) => api.post('/conflict-check', data),
  suggest: (data) => api.post('/conflict-check/suggest', data),
};

// Teams
export const teamAPI = {
  getTeams: () => api.get('/teams'),
  getTeam: (id) => api.get(`/teams/${id}`),
};

// Compliance
export const complianceAPI = {
  getCARAHours: (weekStart) => api.get('/cara-log', { params: { weekStart } }),
  getAthleteCARA: (userId, weekStart) =>
    api.get(`/cara-log/${userId}`, { params: { weekStart } }),
  getSummary: (teamId, weekStart) =>
    api.get('/compliance/summary', { params: { teamId, weekStart } }),
  getForecast: (teamId, weekStart) =>
    api.get('/compliance/forecast', { params: { teamId, weekStart } }),
  exportPDF: (teamId, weekStart) =>
    api.get('/compliance/export/pdf', { params: { teamId, weekStart }, responseType: 'blob' }),
  exportCSV: (teamId, weekStart) =>
    api.get('/compliance/export/csv', { params: { teamId, weekStart }, responseType: 'blob' }),
};

// Admin
export const adminAPI = {
  getSchools: () => api.get('/admin/schools'),
  getSchoolTeams: (id) => api.get(`/admin/schools/${id}/teams`),
  getSchoolStats: (id) => api.get(`/admin/schools/${id}/stats`),
  getVenues: (schoolId) => api.get('/admin/venues', { params: schoolId ? { schoolId } : {} }),
};

// Profile
export const profileAPI = {
  getMyProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

// Todos
export const todoAPI = {
  getTodos: () => api.get('/todos'),
  createTodo: (data) => api.post('/todos', data),
  updateTodo: (id, data) => api.put(`/todos/${id}`, data),
  deleteTodo: (id) => api.delete(`/todos/${id}`),
  toggleTodo: (id) => api.patch(`/todos/${id}/toggle`),
};

// Grades
export const gradesAPI = {
  getMyGrades: () => api.get('/grades/athlete'),
  getTeamGrades: (teamId) => api.get(`/grades/team/${teamId}`),
  enterGrade: (data) => api.post('/grades', data),
  getTeacherGrades: () => api.get('/grades/teacher'),
};

// Trips
export const tripsAPI = {
  getTrips: (params) => api.get('/trips', { params }),
  getTrip: (id) => api.get(`/trips/${id}`),
  createTrip: (data) => api.post('/trips', data),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
};

// Assistant Coach
export const coachAPI = {
  getAssistantCoaches: (teamId) => api.get(`/assistant-coaches/team/${teamId}`),
  addAssistantCoach: (data) => api.post('/assistant-coaches', data),
  updateAssistantCoach: (id, data) => api.put(`/assistant-coaches/${id}`, data),
  removeAssistantCoach: (id) => api.delete(`/assistant-coaches/${id}`),
};

// Appointments
export const appointmentAPI = {
  getAppointments: () => api.get('/appointments'),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (data) => api.post('/appointments', data),
  updateAppointment: (id, data) => api.patch(`/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
};

// Notifications
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};
