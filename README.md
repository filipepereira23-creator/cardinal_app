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
| `src/pages/` | Screens: welcome / sign in / register, account-created confirmation, dashboard, account detail, "what moved", Settings, placeholder About/Privacy/Terms/Contact |
| `src/components/` | Charts, forms, provider list + open-banking style connect flow, provider logos, header, footer, currency switch |
| `src/domain/` | Data types and all the maths (values over time, changes, top movers) |
| `src/config/currencies.ts`, `src/config/fx.ts` | **10 currencies** (USD, GBP, EUR first) and **live FX**: ECB rates via Frankfurter, fallback open.er-api.com, cached 6 h in localStorage, fixed offline fallback |
| `src/data/providers.ts` | Every UK bank, ISA manager, platform, workplace pension and crypto exchange (all "coming soon") |
| `src/data/holdingTypes.ts` | Account and asset types (current account, S&S ISA, workplace pension, watch, car, castle…) |
| `src/data/sample.ts` | Optional sample portfolio with two years of history |
| `src/integrations/` | **Placeholder for live provider connections** (Open Banking, pensions, platforms, crypto). `openBanking.ts` holds the consent screen's permission lists and `startConsent()` |
| `src/integrations/email/` | **Seam for transactional email** (account confirmation). No-op until a backend exists: a static site can't send email |
| `src/valuation/` | **Free asset pricing** (header of `valuers.ts` lists every source). Live: metals spot (gold-api.com), crypto coins (Coinbase public rates), sold prices on the same street (HM Land Registry Price Paid Data, SPARQL). Estimates: London £/m², UK house price index, watch brand trend (WatchCharts public indexes, refreshed per release), car depreciation curve. Check-price links: Chrono24, WatchCharts, Auto Trader, moValue, Zoopla |
| `src/domain/debts.ts` | **Debts**: structured fields only, plus `anonymisedDebt()` for future anonymous aggregation |
| `src/storage/` | Accounts and data storage. v1 = browser storage; swap in a hosted backend here |

## Provider logos

Each provider in `src/data/providers.ts` has a `domain`. `ProviderMark` loads that site's own icon from a public
favicon service (Google's, then icon.horse), and falls back to the brand-coloured initials tile when no real icon
exists. To switch to licensed logo files later, put a local source first in `SOURCES` in `src/components/ProviderMark.tsx`.

## Settings and themes

Settings (theme, number format, hide balances, decimals, default chart period, notification placeholders) are saved
per user. Dark mode sets `<html data-theme="dark">`, which switches the CSS variables in `src/styles.css`; the bird
logo swaps to `public/cardinal-yellow.png`.

## Growth figures

Wherever a period is selected Cardinal shows the % change over that period and the annualised rate (CAGR).
Annualising needs at least 30 days. A % is only shown when the starting value is meaningful (≥ 1 and the move is
under 50×), so a gifted £1 car or a brand-new account never shows "+900,000%". Gains since purchase for assets are
only shown when there's a real purchase price (≥ 100 in its currency, not marked as a gift).
Net worth growth includes money added or withdrawn, so it isn't an investment return.

## Data model in one paragraph

Everything you own is a **Holding** (an account or an asset) in GBP, EUR or USD. A holding has a list of
dated **valuations**, or, for investment and crypto accounts, **positions** (funds, shares, coins) that each
have their own valuations; the account's value is then the sum of its positions. Net worth on any day is the
sum of every holding's last known value on or before that day, converted at the current exchange rate into the display currency. Debts (category `debts`) store their outstanding balance as a positive number and count negatively.

## What's manual today, and where the real thing plugs in

- **Balances**: typed in. Live connections: implement `ProviderConnector` in `src/integrations/`, register it, mark the provider `available`.
- **Asset prices**: gold and other metals are valued live by weight × purity × spot price. Property gets a Land Registry house price index estimate you can apply. Watches and cars stay manual (Chrono24 has no public API; Auto Trader's valuations API is dealer-only and paid; Zoopla's public API was closed) with a check-price link and an update reminder after 90 days.
- **Accounts & sync**: v1 stores data in the browser on each device. A hosted backend (e.g. Supabase) behind
  `src/storage/adapter.ts` gives one login with the same data on phone and computer.
- **FX**: live ECB reference rates fetched on load (see `src/config/fx.ts`); Settings shows the date and source.
- **Debts**: mortgages, loans, car finance, credit cards, student loans and overdrafts are entered by hand and subtract from net worth.
