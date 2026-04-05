import api from './api';

export const notificationService = {
  getAll: async (page = 1, limit = 20, unreadOnly = false) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }
};

export const exportImportService = {
  exportData: async (format = 'json') => {
    const response = await api.get(`/export-import/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  importData: async (data, mode = 'merge') => {
    const response = await api.post('/export-import/import', { data, mode });
    return response.data;
  }
};