// src/utils/formatters.js
import { formatDistanceToNow, format } from 'date-fns';

export const formatPrice = (price) => {
  if (typeof price !== 'number') return '-';
  return price.toFixed(2);
};

export const formatCurrency = (value, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
};

export const formatPercent = (value) => {
  if (typeof value !== 'number') return '-';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatNumber = (value) => {
  if (typeof value !== 'number') return '-';
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '-';
  return format(new Date(date), formatStr);
};

export const formatTime = (date, formatStr = 'HH:mm') => {
  if (!date) return '-';
  return format(new Date(date), formatStr);
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatPips = (pips) => {
  if (typeof pips !== 'number') return '-';
  return `${pips > 0 ? '+' : ''}${pips.toFixed(1)}`;
};

export const formatWinRate = (wins, total) => {
  if (total === 0) return '0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
};

export const shortenText = (text, maxLength = 50) => {
  if (typeof text !== 'string') return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const capitalizeFirst = (text) => {
  if (typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// src/utils/validators.js
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const validateUsername = (username) => {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

export const validatePhone = (phone) => {
  const regex = /^\+?[\d\s\-()]+$/;
  return regex.test(phone);
};

export const validatePrice = (price) => {
  return !isNaN(parseFloat(price)) && parseFloat(price) > 0;
};

export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = formData[field];

    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${rule.label} is required`;
    } else if (rule.type === 'email' && value && !validateEmail(value)) {
      errors[field] = 'Invalid email format';
    } else if (rule.type === 'password' && value && !validatePassword(value)) {
      errors[field] = 'Password must be at least 8 characters';
    } else if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label} must be at least ${rule.minLength} characters`;
    } else if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${rule.label} must not exceed ${rule.maxLength} characters`;
    } else if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${rule.label} format is invalid`;
    }
  });

  return errors;
};

// src/utils/constants.js
export const SIGNAL_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
};

export const SIGNAL_STATUS = {
  RUNNING: 'RUNNING',
  CLOSED: 'CLOSED',
  LIVE: 'LIVE',
  PENDING: 'PENDING',
};

export const SIGNAL_RESULT = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  BREAKEVEN: 'BREAKEVEN',
};

export const MARKET_SESSIONS = {
  ASIA: 'Asia',
  LONDON: 'London',
  NEWYORK: 'New York',
};

export const ECONOMIC_IMPACT = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const USER_TIERS = {
  INACTIVE: 'INACTIVE',
  TRADER: 'TRADER',
  PRIME: 'PRIME',
  ELITE: 'ELITE',
  SULTAN: 'SULTAN',
};

export const TIER_REQUIREMENTS = {
  INACTIVE: 0,
  TRADER: 50,
  PRIME: 500,
  ELITE: 1000,
  SULTAN: 1500,
};

export const TIER_REWARDS = {
  INACTIVE: '-',
  TRADER: 'Merchandise NH',
  PRIME: 'Samsung Galaxy A55',
  ELITE: '$1,000 Cash',
  SULTAN: 'iPhone 17 Pro Max',
};

export const SENTIMENT_LABELS = {
  BULLISH: 'Bullish',
  BEARISH: 'Bearish',
  NEUTRAL: 'Neutral',
};

export const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
];

export const CURRENCY_PAIRS = [
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'BTCUSD',
];

export const API_ENDPOINTS = {
  AUTH: '/auth',
  SIGNALS: '/signals',
  MARKET: '/market',
  COMMUNITY: '/community',
  PROFILE: '/profile',
};

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_PREFERENCES: 'userPreferences',
  CHAT_HISTORY: 'chatHistory',
  SIGNAL_FILTERS: 'signalFilters',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check the form and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  SIGNAL_CREATED: 'Signal created successfully.',
  SIGNAL_UPDATED: 'Signal updated successfully.',
  POST_CREATED: 'Post created successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
};

export const DEBOUNCE_DELAY = 500;
export const TOAST_DURATION = 3000;
export const API_TIMEOUT = 30000;
export const MAX_FILE_SIZE = 5242880; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// src/utils/helpers.js
export const getSignalColor = (type) => {
  return type === SIGNAL_TYPES.BUY ? '#22c55e' : '#ef4444';
};

export const getTierColor = (tier) => {
  const colors = {
    SULTAN: '#d4a574',
    ELITE: '#a78bfa',
    PRIME: '#60a5fa',
    TRADER: '#34d399',
    INACTIVE: '#718096',
  };
  return colors[tier] || '#718096';
};

export const getSentimentColor = (sentiment) => {
  const colors = {
    Bullish: '#22c55e',
    Bearish: '#ef4444',
    Neutral: '#f59e0b',
  };
  return colors[sentiment] || '#718096';
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const cloneDeep = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => cloneDeep(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = cloneDeep(obj[key]);
      }
    }
    return clonedObj;
  }
};

export const getQueryParams = (search) => {
  const params = new URLSearchParams(search);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
};

export const objectToQueryString = (obj) => {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};
