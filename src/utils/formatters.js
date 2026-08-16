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
