// src/services/marketService.js
import api from './api';

export const marketService = {
  getCurrentPrice: async (pair) => {
    const response = await api.get(`/market/price/${pair}`);
    return response.data;
  },

  getPriceHistory: async (pair, timeframe, limit = 100) => {
    const response = await api.get('/market/history', {
      params: { pair, timeframe, limit },
    });
    return response.data;
  },

  getMarketData: async (pair) => {
    const response = await api.get(`/market/data/${pair}`);
    return response.data;
  },

  getEconomicCalendar: async (filters = {}) => {
    const response = await api.get('/market/calendar', { params: filters });
    return response.data;
  },

  getCalendarEvents: async (country = '', impact = '') => {
    const response = await api.get('/market/calendar/events', {
      params: { country, impact },
    });
    return response.data;
  },

  getMarketSentiment: async (pair) => {
    const response = await api.get(`/market/sentiment/${pair}`);
    return response.data;
  },

  getMarketOutlook: async () => {
    const response = await api.get('/market/outlook');
    return response.data;
  },

  getDailyOutlook: async () => {
    const response = await api.get('/market/outlook/daily');
    return response.data;
  },

  getResearch: async (filters = {}) => {
    const response = await api.get('/market/research', { params: filters });
    return response.data;
  },

  getSessionOverview: async () => {
    const response = await api.get('/market/sessions');
    return response.data;
  },

  getMarketDrivers: async () => {
    const response = await api.get('/market/drivers');
    return response.data;
  },

  getSupportResistance: async (pair) => {
    const response = await api.get(`/market/levels/${pair}`);
    return response.data;
  },

  getForecasts: async () => {
    const response = await api.get('/market/forecasts');
    return response.data;
  },

  getAnalysis: async (pair) => {
    const response = await api.get(`/market/analysis/${pair}`);
    return response.data;
  },
};
