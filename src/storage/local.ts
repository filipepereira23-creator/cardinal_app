import type { AuthAdapter, StorageAdapter } from './adapter';
import { DEFAULT_SETTINGS, type Portfolio, type Settings, type UserProfile } from '../domain/types';

const USERS_KEY = 'cardinal.users.v1';
const SESSION_KEY = 'cardinal.session.v1';
const portfolioKey = (id: string) => `cardinal.portfolio.v1.${id}`;
const settingsKey = (id: string) => `cardinal.settings.v1.${id}`;

interface StoredUser extends UserProfile {
  salt: string;
  hash: string;
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeUsers(u: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  if (crypto?.subtle) {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120_000, hash: 'SHA-256' }, key, 256);
    return toHex(bits);
  }
  // Fallback for non-secure contexts (plain http on a LAN). Not for production.
  let h = 0;
  for (const c of salt + password) h = (h * 31 + c.charCodeAt(0)) | 0;
  return 'weak-' + h.toString(16);
}

export function uid(): string {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const strip = ({ salt: _s, hash: _h, ...p }: StoredUser): UserProfile => p;

export class LocalAuth implements AuthAdapter {
  async register(input: { firstName: string; lastName: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const users = readUsers();
    if (users.some((u) => u.email === email)) throw new Error('An account with this email already exists. Try logging in.');
    const salt = uid();
    const user: StoredUser = {
      id: uid(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      createdAt: new Date().toISOString(),
      salt,
      hash: await hashPassword(input.password, salt),
    };
    writeUsers([...users, user]);
    localStorage.setItem(SESSION_KEY, user.id);
    return strip(user);
  }

  async login(email: string, password: string) {
    const user = readUsers().find((u) => u.email === email.trim().toLowerCase());
    if (!user || (await hashPassword(password, user.salt)) !== user.hash) throw new Error('That email and password don\'t match.');
    localStorage.setItem(SESSION_KEY, user.id);
    return strip(user);
  }

  async logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  async currentUser() {
    const id = localStorage.getItem(SESSION_KEY);
    const user = id ? readUsers().find((u) => u.id === id) : undefined;
    return user ? strip(user) : null;
  }

  async updateProfile(userId: string, patch: { firstName?: string; lastName?: string; email?: string }) {
    const users = readUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('Account not found.');
    const email = patch.email?.trim().toLowerCase();
    if (email && email !== user.email && users.some((u) => u.email === email)) throw new Error('Another account already uses this email.');
    if (patch.firstName !== undefined) user.firstName = patch.firstName.trim();
    if (patch.lastName !== undefined) user.lastName = patch.lastName.trim();
    if (email) user.email = email;
    writeUsers(users);
    return strip(user);
  }

  async deleteAccount(userId: string) {
    writeUsers(readUsers().filter((u) => u.id !== userId));
    localStorage.removeItem(portfolioKey(userId));
    localStorage.removeItem(settingsKey(userId));
    localStorage.removeItem(SESSION_KEY);
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async loadPortfolio(userId: string): Promise<Portfolio> {
    try {
      const raw = localStorage.getItem(portfolioKey(userId));
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through */
    }
    return { holdings: [], displayCurrency: 'GBP' };
  }
  async savePortfolio(userId: string, portfolio: Portfolio) {
    localStorage.setItem(portfolioKey(userId), JSON.stringify(portfolio));
  }
  async loadSettings(userId: string): Promise<Settings> {
    try {
      const raw = localStorage.getItem(settingsKey(userId));
      if (raw) {
        const s = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...s, notifications: { ...DEFAULT_SETTINGS.notifications, ...s.notifications } };
      }
    } catch {
      /* fall through */
    }
    return DEFAULT_SETTINGS;
  }
  async saveSettings(userId: string, settings: Settings) {
    localStorage.setItem(settingsKey(userId), JSON.stringify(settings));
  }
  async deleteAll(userId: string) {
    localStorage.removeItem(portfolioKey(userId));
    localStorage.removeItem(settingsKey(userId));
  }
}
