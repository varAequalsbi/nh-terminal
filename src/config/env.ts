type FeatureFlags = { liveMarket: boolean; liveCommunity: boolean };

const requiredInProduction = (name: string, value: string | undefined) => {
  if (import.meta.env.PROD && !value) throw new Error(`Missing required environment variable: ${name}`);
  return value || '';
};

const asBoolean = (value: string | undefined) => value === 'true';

export const env = Object.freeze({
  appEnv: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  wsUrl: import.meta.env.VITE_WS_URL || '',
  cdnUrl: import.meta.env.VITE_CDN_URL || '',
  analyticsUrl: import.meta.env.VITE_ANALYTICS_URL || '',
  maintenanceMode: asBoolean(import.meta.env.VITE_MAINTENANCE_MODE),
  marketProvider: import.meta.env.VITE_MARKET_PROVIDER || 'twelve-data',
  calendarProvider: import.meta.env.VITE_CALENDAR_PROVIDER || 'trading-economics',
  features: Object.freeze<FeatureFlags>({
    liveMarket: asBoolean(import.meta.env.VITE_ENABLE_LIVE_MARKET),
    liveCommunity: asBoolean(import.meta.env.VITE_ENABLE_LIVE_COMMUNITY),
  }),
});

export const cdnUrl = (path: string) => env.cdnUrl ? `${env.cdnUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : path;
