# Private XAUUSD model trial

This is a **research-only, local** signal candidate generator. It never creates a
member-visible signal, places a trade, or changes the application's existing
AI feed. Do not describe its predictions or backtest as verified trading advice.

## How it works

- Uses closed, hourly `XAU/USD` OHLC candles from Twelve Data. The API key is a
  **market-data** key, not a language-model key. The adapter requests UTC
  timestamps and ignores an unfinished current bar.
- Creates six price/volatility features from candles available at each decision
  time. Labels use the close four bars later relative to a fixed 0.75 ATR
  movement threshold. This is a direction experiment, not an execution or P&L
  model; spreads, slippage, fees, and actual fill prices are not represented.
- Trains a three-class regularized softmax regression model (`SELL`, `NO SIGNAL`,
  `BUY`). It splits history chronologically into 70% training, 15% validation,
  and 15% untouched test periods. Labels that would cross a split are excluded.
  Feature scaling is fit only on training data. No parameters are selected using
  the test period.
- Requires at least 500 closed hourly candles and 50 continuous examples per
  split. Gaps (including market closures) are never treated as continuous bars.
- A directional decision needs a class probability of at least 0.62. Otherwise
  it records `NO SIGNAL`. Data older than two hours after the most recent bar
  closed also records `NO SIGNAL`. The score is a model output, **not** a
  calibrated chance of profit.

## Setup

Choose a Twelve Data plan that actually permits the requested XAU/USD hourly
history and your intended display/redistribution use. Plan entitlements must
be confirmed with the provider before any member-visible release.

Create `.env.ai.local` in the project root:

```text
TWELVE_DATA_API_KEY=your_key_here
```

Keep that file local; `.env.*.local` is ignored by Git. Never use a `VITE_`
prefix for this key. Do not paste it into chat, code, or a browser URL.

```powershell
npm run ai:train
npm run ai:decide
npm run ai:watch
npm run ai:status
```

`ai:train` requests up to 5,000 hourly candles and writes its model and
chronological evaluation to the ignored `.local-ai/` directory. `ai:decide`
fetches the recent 100 candles, scores the most recent closed bar, and appends
one private log entry per model and bar. Repeating it for the same bar does not
create another entry. `ai:status` prints the saved test metrics and last logged
decision. `ai:watch` runs the decision check at startup and again five minutes
after each UTC hour closes while the local process remains running. It makes at
most one provider request each hour after startup and keeps decisions private.
The watch process is a local trial, not a deployed scheduler. There is no public
API route or automatic publication.

For historical data supplied as a local JSON array of objects with
`openedAt` (ISO UTC), `open`, `high`, `low`, and `close`, run:

```powershell
node scripts/ai-signals.js train --file .\path\to\candles.json
```

This offline input path permits model development without a provider account.
It does not validate the provider adapter or live data entitlement.

## What to review before member publication

The held-out test reports accuracy, a majority-class baseline, directional
accuracy among emitted BUY/SELL decisions, and how many decisions were emitted.
These are classification metrics, not profit. Check them across different
market regimes and on forward-recorded decisions. Then define executable
entry, stop, target, expiry, spread/slippage, maximum frequency, duplicate
prevention, stale-feed behavior, and an emergency disable switch. A licensed
price feed and a separately reviewed publication path are required. If the
model does not outperform simple baselines or emits too few signals for a useful
evaluation, keep it private and revise the experiment.
