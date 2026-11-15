/**
 * ─── PROVIDER CONNECTIONS (future) ─────────────────────────────────────────
 *
 * v1 is manual entry only. This is where real connections plug in later:
 *   • Banks, ISAs and savings  → UK Open Banking (e.g. TrueLayer, Yapily, GoCardless
 *                                 Bank Account Data, Plaid UK). Read-only AIS consent.
 *   • Pensions                 → Pensions Dashboards Programme / provider APIs.
 *   • Investment platforms     → platform APIs or aggregators.
 *   • Crypto                   → exchange read-only API keys, or public wallet addresses.
 *
 * Cardinal never moves money: every connector is read-only.
 *
 * To add one:
 *   1. Implement `ProviderConnector` (see the stub in ./registry.ts).
 *   2. Register it under the provider id used in src/data/providers.ts.
 *   3. Set that provider's status to 'available'.
 * The "Connect" grid will then start the real flow instead of showing "Coming soon",
 * and synced accounts arrive as Holdings with source = 'connected'.
 * Connections need a server (to hold provider secrets), so they arrive together
 * with the backend described in src/storage/adapter.ts.
 */
import type { Holding } from '../domain/types';

export interface ConnectedAccount {
  externalId: string;
  name: string;
  holding: Omit<Holding, 'id' | 'createdAt'>;
}

export interface ProviderConnector {
  providerId: string;
  /** Starts the consent flow (usually a redirect to the provider). */
  connect(): Promise<void>;
  /** Lists accounts the user granted access to, with balances and history. */
  fetchAccounts(): Promise<ConnectedAccount[]>;
  /** Removes consent. */
  disconnect(): Promise<void>;
}
