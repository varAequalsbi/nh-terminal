import api from './api';
import type {
  Announcement, ApiPage, ChatMessage, Conversation, Course, EconomicEvent,
  ForumPost, MarketPrice, PriceCandle, Signal, Tier, User,
} from '../types/models';

export type ListParams = { cursor?: string; search?: string; limit?: number; [key: string]: string | number | boolean | undefined };

const list = async <T>(url: string, params?: ListParams): Promise<ApiPage<T>> => (await api.get(url, { params })).data;
const detail = async <T>(url: string): Promise<T> => (await api.get(url)).data;

/** Canonical typed gateway for the NH backend. Provider credentials stay behind this API. */
export const dataService = {
  users: { me: () => detail<User>('/auth/me'), profile: (id: string) => detail<User>(`/users/${id}`) },
  tiers: { list: () => list<Tier>('/tiers') },
  signals: {
    list: (params?: ListParams) => list<Signal>('/signals', params),
    detail: (id: string) => detail<Signal>(`/signals/${id}`),
    create: async (input: Partial<Signal>) => (await api.post('/signals', input)).data as Signal,
    update: async (id: string, input: Partial<Signal>) => (await api.put(`/signals/${id}`, input)).data as Signal,
    remove: async (id: string) => (await api.delete(`/signals/${id}`)).data as {success:boolean},
  },
  market: {
    price: (symbol: string) => detail<MarketPrice>(`/market/price/${symbol}`),
    candles: (symbol: string, interval = '5min') => detail<PriceCandle[]>(`/market/candles/${symbol}?interval=${encodeURIComponent(interval)}`),
    calendar: (params?: ListParams) => list<EconomicEvent>('/market/calendar', params),
    outlook: () => detail<any>('/market/outlook'),
    research: () => detail<any>('/market/research'),
    sentiment: (symbol: string) => detail<any>(`/market/sentiment/${symbol}`),
  },
  community: {
    posts: (params?: ListParams) => list<ForumPost>('/community/forum', params),
    createPost: async (input: {body:string}) => (await api.post('/community/forum', input)).data,
    comments: (postId: string) => list<any>(`/community/forum/${postId}/comments`),
    createComment: async (postId: string, input: {body:string;parentId?:string|null}) => (await api.post(`/community/forum/${postId}/comments`, input)).data,
    liveSession: () => detail<any>('/community/live-session'),
  },
  chat: {
    conversations: (params?: ListParams) => list<Conversation>('/conversations', params),
    messages: (conversationId: string, params?: ListParams) => list<ChatMessage>(`/conversations/${conversationId}/messages`, params),
    send: async (conversationId: string, body: string) => (await api.post(`/conversations/${conversationId}/messages`, { body })).data,
    markRead: async (conversationId: string) => (await api.post(`/conversations/${conversationId}/read`)).data,
  },
  announcements: { list: (params?: ListParams) => list<Announcement>('/community/announcements', params), detail: (id:string) => detail<Announcement>(`/community/announcements/${id}`), create: async (input: {title:string;body:string}) => (await api.post('/community/announcements', input)).data, markRead: async (id:string) => (await api.post(`/community/announcements/${id}/read`)).data },
  courses: { list: (params?: ListParams) => list<Course>('/courses', params) },
};

export const queryKeys = {
  me: ['me'] as const,
  tiers: ['tiers'] as const,
  signals: (params?: ListParams) => ['signals', params || {}] as const,
  signal: (id: string) => ['signal', id] as const,
  price: (symbol: string) => ['price', symbol] as const,
  candles: (symbol: string, interval: string) => ['candles', symbol, interval] as const,
  calendar: (params?: ListParams) => ['calendar', params || {}] as const,
  posts: (params?: ListParams) => ['posts', params || {}] as const,
  conversations: ['conversations'] as const,
  announcements: ['announcements'] as const,
  courses: ['courses'] as const,
};
