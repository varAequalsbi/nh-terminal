// src/services/communityService.js
import api from './api';

export const communityService = {
  // Forum Management
  getForumPosts: async (filters = {}) => {
    const response = await api.get('/community/forum', { params: filters });
    return response.data;
  },

  getForumPost: async (id) => {
    const response = await api.get(`/community/forum/${id}`);
    return response.data;
  },

  createForumPost: async (postData) => {
    const response = await api.post('/community/forum', postData);
    return response.data;
  },

  updateForumPost: async (id, postData) => {
    const response = await api.put(`/community/forum/${id}`, postData);
    return response.data;
  },

  deleteForumPost: async (id) => {
    const response = await api.delete(`/community/forum/${id}`);
    return response.data;
  },

  // Forum Comments
  getPostComments: async (postId) => {
    const response = await api.get(`/community/forum/${postId}/comments`);
    return response.data;
  },

  addPostComment: async (postId, comment) => {
    const response = await api.post(`/community/forum/${postId}/comments`, { content: comment });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/community/comments/${commentId}`);
    return response.data;
  },

  // Live Trade Chat
  getLiveTradeMessages: async (limit = 50) => {
    const response = await api.get('/community/live-trade', { params: { limit } });
    return response.data;
  },

  sendLiveTradeMessage: async (message) => {
    const response = await api.post('/community/live-trade/messages', { content: message });
    return response.data;
  },

  // Announcements
  getAnnouncements: async () => {
    const response = await api.get('/community/announcements');
    return response.data;
  },

  getAnnouncement: async (id) => {
    const response = await api.get(`/community/announcements/${id}`);
    return response.data;
  },

  createAnnouncement: async (announcementData) => {
    const formData = new FormData();
    Object.keys(announcementData).forEach((key) => {
      formData.append(key, announcementData[key]);
    });

    const response = await api.post('/community/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateAnnouncement: async (id, announcementData) => {
    const response = await api.put(`/community/announcements/${id}`, announcementData);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/community/announcements/${id}`);
    return response.data;
  },

  // User Interactions
  likePost: async (postId) => {
    const response = await api.post(`/community/forum/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId) => {
    const response = await api.post(`/community/forum/${postId}/unlike`);
    return response.data;
  },

  reportPost: async (postId, reason) => {
    const response = await api.post(`/community/forum/${postId}/report`, { reason });
    return response.data;
  },

  // Community Stats
  getCommunityStats: async () => {
    const response = await api.get('/community/stats');
    return response.data;
  },

  getUserStats: async (userId) => {
    const response = await api.get(`/community/users/${userId}/stats`);
    return response.data;
  },

  // Member Ranking
  getTopMembers: async (limit = 10) => {
    const response = await api.get('/community/top-members', { params: { limit } });
    return response.data;
  },

  getMembersByTier: async (tier) => {
    const response = await api.get(`/community/members/${tier}`);
    return response.data;
  },
};
