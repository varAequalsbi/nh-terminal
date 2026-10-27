# Data-provider decision

NH Terminal should access external providers through its own backend proxy. Provider keys must not be exposed as `VITE_*` browser variables.

## Recommended providers

- **Twelve Data** for FX, metals, crypto quotes, OHLC time series, and optional WebSocket prices. Symbols use provider notation such as `EUR/USD`. Coverage, real-time availability, WebSocket access, commercial display, and redistribution depend on the subscribed plan.
- **Trading Economics** for the economic calendar, including event date, country, impact, previous, forecast/consensus, actual, source, and revisions. Its API and live streaming require a subscription; cache and redistribution rights must be confirmed before launch.

Alpha Vantage is a useful development fallback, but its FX intraday endpoint is premium and it does not replace a full economic-calendar provider.

## Backend contract

The frontend calls `VITE_API_URL`. The backend normalizes provider payloads to the models in `src/types/models.ts`, applies caching/rate limits, and exposes provider attribution and timestamps. It should adapt provider symbols and keep all API credentials in server-side secret storage.

Suggested proxy endpoints:

- `GET /market/price/:symbol`
- `GET /market/candles/:symbol?interval=5min`
- `GET /market/calendar?from=&to=&country=&impact=`
- `WS /ws?channel=prices&symbols=XAUUSD,EURUSD`

## Current adapters

- Local development runs `server/index.js` on port 3000 and persists application state in local PostgreSQL through the shared relational repository.
- Vercel exposes the same contract through `api/[...path].js` and requires a server-only `DATABASE_URL`. No JSON or process-memory write fallback remains.
- Quote, candle, sentiment, and calendar records are still local fixtures. Keep live-market feature flags disabled until licensed provider adapters and attribution requirements are complete.
