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

- Local development runs `server/index.js` on port 3000 and persists mutations to `server/data/db.json` through `server/repository.js`.
- Vercel exposes the same read/write contract through `api/[...path].js`, so deployed pages display API data instead of component constants. Its seed adapter is intentionally non-durable across serverless instances. Replace that adapter with the production database before accepting production writes.
