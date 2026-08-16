// src/services/signalService.js
import api from './api';

export const signalService = {
  getAllSignals: async (filters = {}) => {
    const response = await api.get('/signals', { params: filters });
    return response.data;
  },

  getSignalById: async (id) => {
    const response = await api.get(`/signals/${id}`);
    return response.data;
  },

  createSignal: async (signalData) => {
    const formData = new FormData();
    Object.keys(signalData).forEach((key) => {
      formData.append(key, signalData[key]);
    });

    const response = await api.post('/signals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateSignal: async (id, signalData) => {
    const response = await api.put(`/signals/${id}`, signalData);
    return response.data;
  },

  deleteSignal: async (id) => {
    const response = await api.delete(`/signals/${id}`);
    return response.data;
  },

  getSignalHistory: async (id) => {
    const response = await api.get(`/signals/${id}/history`);
    return response.data;
  },

  getSignalStatistics: async () => {
    const response = await api.get('/signals/statistics');
    return response.data;
  },

  getActiveSignals: async () => {
    const response = await api.get('/signals?status=active');
    return response.data;
  },

  getSignalsBySession: async (session) => {
    const response = await api.get(`/signals?session=${session}`);
    return response.data;
  },

  likeSignal: async (id) => {
    const response = await api.post(`/signals/${id}/like`);
    return response.data;
  },

  commentOnSignal: async (id, comment) => {
    const response = await api.post(`/signals/${id}/comments`, { content: comment });
    return response.data;
  },
};
