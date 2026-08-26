export type Id = string;
export type UserRole = 'member' | 'expert' | 'moderator' | 'admin' | 'super-admin';
export type TierName = 'INACTIVE' | 'TRADER' | 'PRIME' | 'ELITE' | 'SULTAN';
export type SignalDirection = 'BUY' | 'SELL';
export type SignalStatus = 'draft' | 'published' | 'running' | 'completed' | 'cancelled' | 'expired';
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'offline' | 'forbidden' | 'maintenance';

export interface UserPreferences { language: 'id' | 'en'; emailSignals: boolean; emailAnnouncements: boolean; browserNotifications: boolean; }
export interface User { id: Id; name: string; username?: string; email: string; role: UserRole; tier: TierName; avatarUrl?: string; preferences?: UserPreferences; }
export interface Tier { id: Id; name: TierName; minimumLots: number; reward: string; }
export interface PriceCandle { timestamp: string; open: number; high: number; low: number; close: number; volume?: number; }
export interface MarketPrice { symbol: string; price: number; change: number; high: number; low: number; open: number; updatedAt: string; }
export interface Signal { id: Id; symbol: string; direction: SignalDirection; entry: number; stopLoss: number; targets: number[]; status: SignalStatus; session: string; analysis: string; createdAt: string; source?: 'expert' | 'ai'; result?: 'open' | 'win' | 'loss' | 'cancelled'; pips?: number; updatedAt?: string; history?: Array<{status: SignalStatus; at: string; note?: string}>; author?: User; }
export interface EconomicEvent { id: Id; date: string; country: string; currency?: string; impact: 'low' | 'medium' | 'high'; event: string; previous?: string; forecast?: string; actual?: string; source?: string; }
export interface ForumPost { id: Id; author: User; body: string; createdAt: string; reactions: number; comments: number; attachmentUrls?: string[]; }
export interface Conversation { id: Id; title: string; unreadCount: number; updatedAt: string; }
export interface ChatMessage { id: Id; conversationId: Id; senderId: Id; body: string; createdAt: string; status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'; }
export interface Announcement { id: Id; title: string; body: string; author: User; publishedAt: string; pinned?: boolean; imageUrl?: string; }
export interface Course { id: Id; title: string; requiredTier: TierName; durationSeconds: number; progressSeconds?: number; completed?: boolean; }
export interface Session { accessToken?: string; user: User; expiresAt?: string; }
export interface ApiPage<T> { items: T[]; nextCursor?: string; total?: number; }
