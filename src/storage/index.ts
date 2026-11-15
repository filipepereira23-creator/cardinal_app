import { LocalAuth, LocalStorageAdapter } from './local';
import type { AuthAdapter, StorageAdapter } from './adapter';

// Swap these two lines for a hosted backend later (see adapter.ts).
export const auth: AuthAdapter = new LocalAuth();
export const storage: StorageAdapter = new LocalStorageAdapter();
