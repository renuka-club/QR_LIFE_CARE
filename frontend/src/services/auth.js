import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userId', response.data.data.userId);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userId', response.data.data.userId);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const reportService = {
  uploadReport: async (formData) => {
    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/reports');
    return response.data;
  },

  getReport: async (reportId) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  deleteReport: async (reportId) => {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  }
};

export const aiService = {
  analyzeReport: async (reportId) => {
    const response = await api.post(`/ai/analyze/${reportId}`);
    return response.data;
  },

  chat: async (message) => {
    const response = await api.post('/ai/chat', { message });
    return response.data;
  },

  getReminders: async () => {
    const response = await api.get('/ai/reminders');
    return response.data;
  },

  getChatHistory: async () => {
    const response = await api.get('/ai/chat');
    return response.data;
  },

  sendEmailNotification: async (reportId) => {
    const response = await api.post(`/ai/notify/${reportId}`);
    return response.data;
  }
};