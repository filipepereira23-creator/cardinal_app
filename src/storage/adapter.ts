/**
 * ─── STORAGE ────────────────────────────────────────────────────────────────
 *
 * v1 keeps accounts and data in the browser (localStorage). That means data
 * lives on the device it was entered on.
 *
 * Next step: a hosted backend (e.g. Supabase or Firebase: auth + database)
 * so the same login shows the same numbers on phone and computer. Implement
 * `StorageAdapter` + `AuthAdapter` against it and swap them in src/storage/index.ts.
 * Nothing in the UI needs to change.
 */
import type { Portfolio, Settings, UserProfile } from '../domain/types';

export interface StorageAdapter {
  loadPortfolio(userId: string): Promise<Portfolio>;
  savePortfolio(userId: string, portfolio: Portfolio): Promise<void>;
  loadSettings(userId: string): Promise<Settings>;
  saveSettings(userId: string, settings: Settings): Promise<void>;
  /** Removes everything stored for the user (portfolio and settings). */
  deleteAll(userId: string): Promise<void>;
}

export interface AuthAdapter {
  register(input: { firstName: string; lastName: string; email: string; password: string }): Promise<UserProfile>;
  login(email: string, password: string): Promise<UserProfile>;
  logout(): Promise<void>;
  currentUser(): Promise<UserProfile | null>;
  updateProfile(userId: string, patch: { firstName?: string; lastName?: string; email?: string }): Promise<UserProfile>;
  deleteAccount(userId: string): Promise<void>;
}
