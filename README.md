# Cardinal

A personal wealth tracker: one total net worth figure, a stock-chart style graph of how it moves,
and four tabs (Cash, Investment, Crypto, Assets) that drill down to individual accounts and the funds inside them.
Design follows the REDBIRD interface guidelines: white, minimal, HSBC-red accents.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into /docs
```

Pushing to `main` deploys automatically to GitHub Pages (`.github/workflows/deploy.yml`).

## How it's organised

| Path | What lives there |
| --- | --- |
| `src/pages/` | Screens: welcome / sign in / register, dashboard, account detail, "what moved" |
| `src/components/` | Charts, forms, provider grid, header, currency switch |
| `src/domain/` | Data types and all the maths (values over time, changes, top movers) |
| `src/config/currencies.ts` | **Fixed FX rates** (GBP, EUR, USD). Edit the numbers to update them |
| `src/data/providers.ts` | Every UK bank, ISA manager, platform, workplace pension and crypto exchange (all "coming soon") |
| `src/data/holdingTypes.ts` | Account and asset types (current account, S&S ISA, workplace pension, watch, car, castle…) |
| `src/data/sample.ts` | Optional sample portfolio with two years of history |
| `src/integrations/` | **Placeholder for live provider connections** (Open Banking, pensions, platforms, crypto) |
| `src/valuation/` | **Placeholder for live asset prices** (Chrono24 for watches, cars, property, gold) |
| `src/storage/` | Accounts and data storage. v1 = browser storage; swap in a hosted backend here |

## Data model in one paragraph

Everything you own is a **Holding** (an account or an asset) in GBP, EUR or USD. A holding has a list of
dated **valuations**, or, for investment and crypto accounts, **positions** (funds, shares, coins) that each
have their own valuations; the account's value is then the sum of its positions. Net worth on any day is the
sum of every holding's last known value on or before that day, converted at the fixed rate into the display currency.

## What's manual today, and where the real thing plugs in

- **Balances**: typed in. Live connections: implement `ProviderConnector` in `src/integrations/`, register it, mark the provider `available`.
- **Asset prices**: typed in. Live prices: implement `AssetValuer` in `src/valuation/` (Chrono24 for watches first).
- **Accounts & sync**: v1 stores data in the browser on each device. A hosted backend (e.g. Supabase) behind
  `src/storage/adapter.ts` gives one login with the same data on phone and computer.
- **FX**: fixed rates in `src/config/currencies.ts`; can be replaced by a daily rates feed with the same `convert()` function.
