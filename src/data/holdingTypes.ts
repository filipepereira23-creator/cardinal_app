import type { CategoryId } from '../domain/types';
import type { ProviderKind } from './providers';
import { METALS, PURITIES, WEIGHT_UNITS } from '../valuation/metals';

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  /** A fixed list of choices (rendered as a select). Keeps the value structured. */
  options?: { value: string; label: string }[];
  /** Numeric input. */
  numeric?: boolean;
}

export interface HoldingType {
  id: string;
  category: CategoryId;
  label: string;
  /** Which provider lists to offer for this type (empty = no provider picker). */
  providerKinds: ProviderKind[];
  /** Whether the account can hold individual funds / shares / coins. */
  allowsPositions: boolean;
  /** Extra descriptive fields shown when adding (mostly for physical assets). */
  fields?: FieldDef[];
  icon: string;
}

export const HOLDING_TYPES: HoldingType[] = [
  // Cash
  { id: 'current', category: 'cash', label: 'Current account', providerKinds: ['bank'], allowsPositions: false, icon: 'bank' },
  { id: 'savings', category: 'cash', label: 'Savings account', providerKinds: ['bank'], allowsPositions: false, icon: 'piggy' },
  { id: 'cash_isa', category: 'cash', label: 'Cash ISA', providerKinds: ['bank', 'isa'], allowsPositions: false, icon: 'shield' },
  { id: 'premium_bonds', category: 'cash', label: 'Premium Bonds / NS&I', providerKinds: ['bank'], allowsPositions: false, icon: 'ticket' },
  { id: 'cash_other', category: 'cash', label: 'Other cash', providerKinds: [], allowsPositions: false, icon: 'wallet' },

  // Investment
  { id: 'ss_isa', category: 'investment', label: 'Stocks & Shares ISA', providerKinds: ['isa'], allowsPositions: true, icon: 'chart' },
  { id: 'lisa', category: 'investment', label: 'Lifetime ISA', providerKinds: ['isa'], allowsPositions: true, icon: 'chart' },
  { id: 'gia', category: 'investment', label: 'General investment account', providerKinds: ['investment'], allowsPositions: true, icon: 'chart' },
  { id: 'workplace_pension', category: 'investment', label: 'Workplace pension', providerKinds: ['pension_workplace'], allowsPositions: true, icon: 'briefcase' },
  { id: 'sipp', category: 'investment', label: 'SIPP / personal pension', providerKinds: ['pension_personal'], allowsPositions: true, icon: 'umbrella' },
  { id: 'investment_other', category: 'investment', label: 'Other investment', providerKinds: ['investment'], allowsPositions: true, icon: 'chart' },

  // Crypto
  { id: 'exchange', category: 'crypto', label: 'Exchange account', providerKinds: ['crypto'], allowsPositions: true, icon: 'coin' },
  { id: 'wallet', category: 'crypto', label: 'Wallet', providerKinds: ['crypto'], allowsPositions: true, icon: 'coin' },

  // Assets
  { id: 'watch', category: 'assets', label: 'Watch', providerKinds: [], allowsPositions: false, icon: 'watch',
    fields: [{ key: 'brand', label: 'Brand', placeholder: 'Rolex' }, { key: 'model', label: 'Model', placeholder: 'Day-Date 40' }, { key: 'reference', label: 'Reference', placeholder: '228238' }, { key: 'year', label: 'Year', placeholder: '2019' }] },
  { id: 'car', category: 'assets', label: 'Car', providerKinds: [], allowsPositions: false, icon: 'car',
    fields: [{ key: 'make', label: 'Make', placeholder: 'Porsche' }, { key: 'model', label: 'Model', placeholder: '911 Carrera' }, { key: 'year', label: 'Year', placeholder: '2008' }, { key: 'registration', label: 'Registration', placeholder: 'Optional' }] },
  { id: 'property', category: 'assets', label: 'Property', providerKinds: [], allowsPositions: false, icon: 'house',
    fields: [{ key: 'address', label: 'Address', placeholder: 'Street, city' }, { key: 'postcode', label: 'Postcode', placeholder: 'SW5 0JQ' }] },
  { id: 'chalet', category: 'assets', label: 'Chalet', providerKinds: [], allowsPositions: false, icon: 'chalet',
    fields: [{ key: 'location', label: 'Location', placeholder: 'Verbier' }] },
  { id: 'castle', category: 'assets', label: 'Castle', providerKinds: [], allowsPositions: false, icon: 'castle',
    fields: [{ key: 'location', label: 'Location', placeholder: 'Sintra' }] },
  { id: 'boat', category: 'assets', label: 'Boat', providerKinds: [], allowsPositions: false, icon: 'boat',
    fields: [{ key: 'make', label: 'Make', placeholder: 'Riva' }, { key: 'model', label: 'Model', placeholder: 'Aquarama' }, { key: 'year', label: 'Year', placeholder: '1968' }] },
  { id: 'gold', category: 'assets', label: 'Gold & precious metals', providerKinds: [], allowsPositions: false, icon: 'gold',
    fields: [
      { key: 'metal', label: 'Metal', options: METALS.map((m) => ({ value: m.id, label: m.label })) },
      { key: 'purity', label: 'Purity', options: PURITIES },
      { key: 'weight', label: 'Weight', placeholder: '100', numeric: true },
      { key: 'unit', label: 'Unit', options: WEIGHT_UNITS },
    ] },
  { id: 'art', category: 'assets', label: 'Art & collectibles', providerKinds: [], allowsPositions: false, icon: 'art',
    fields: [{ key: 'artist', label: 'Artist / maker', placeholder: 'Optional' }, { key: 'year', label: 'Year', placeholder: 'Optional' }] },
  { id: 'jewellery', category: 'assets', label: 'Jewellery', providerKinds: [], allowsPositions: false, icon: 'gem',
    fields: [{ key: 'description', label: 'Description', placeholder: 'Optional' }] },
  { id: 'asset_other', category: 'assets', label: 'Something else', providerKinds: [], allowsPositions: false, icon: 'box',
    fields: [{ key: 'description', label: 'Description', placeholder: 'Optional' }] },

  // Debts: entered by hand. Lender (optional) comes from the UK provider list.
  { id: 'mortgage', category: 'debts', label: 'Mortgage', providerKinds: ['bank', 'lender'], allowsPositions: false, icon: 'house' },
  { id: 'personal_loan', category: 'debts', label: 'Personal loan', providerKinds: ['bank', 'lender'], allowsPositions: false, icon: 'wallet' },
  { id: 'car_finance', category: 'debts', label: 'Car finance', providerKinds: ['lender', 'bank'], allowsPositions: false, icon: 'car' },
  { id: 'credit_card', category: 'debts', label: 'Credit card', providerKinds: ['lender', 'bank'], allowsPositions: false, icon: 'card' },
  { id: 'student_loan', category: 'debts', label: 'Student loan', providerKinds: ['lender'], allowsPositions: false, icon: 'cap' },
  { id: 'overdraft', category: 'debts', label: 'Overdraft', providerKinds: ['bank'], allowsPositions: false, icon: 'bank' },
  { id: 'debt_other', category: 'debts', label: 'Other debt', providerKinds: ['lender', 'bank'], allowsPositions: false, icon: 'box' },
];

export function typesFor(category: CategoryId): HoldingType[] {
  return HOLDING_TYPES.filter((t) => t.category === category);
}

export function typeById(id: string): HoldingType | undefined {
  return HOLDING_TYPES.find((t) => t.id === id);
}
