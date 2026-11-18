import type { CategoryId } from '../domain/types';

export const CATEGORIES: { id: CategoryId; label: string; singular: string; blurb: string }[] = [
  { id: 'cash', label: 'Cash', singular: 'cash account', blurb: 'Current accounts, savings and cash ISAs' },
  { id: 'investment', label: 'Investment', singular: 'investment account', blurb: 'ISAs, investment accounts and pensions' },
  { id: 'crypto', label: 'Crypto', singular: 'crypto holding', blurb: 'Exchanges and wallets' },
  { id: 'assets', label: 'Assets', singular: 'asset', blurb: 'Watches, cars, property, gold and more' },
  { id: 'debts', label: 'Debts', singular: 'debt', blurb: 'Mortgages, loans, car finance, credit cards and student loans' },
];

/** Category colours live in config/palette.ts (they change with light and dark mode). */
