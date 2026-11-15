import type { CategoryId } from '../domain/types';

export const CATEGORIES: { id: CategoryId; label: string; singular: string; blurb: string }[] = [
  { id: 'cash', label: 'Cash', singular: 'cash account', blurb: 'Current accounts, savings and cash ISAs' },
  { id: 'investment', label: 'Investment', singular: 'investment account', blurb: 'ISAs, investment accounts and pensions' },
  { id: 'crypto', label: 'Crypto', singular: 'crypto holding', blurb: 'Exchanges and wallets' },
  { id: 'assets', label: 'Assets', singular: 'asset', blurb: 'Watches, cars, property, gold and more' },
];

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  cash: '#DB0011',
  investment: '#8E0A12',
  crypto: '#F0807F',
  assets: '#4A4A4A',
};
