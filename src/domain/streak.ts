/**
 * Daily check-in streak, kept on this device per user (no server needed).
 * Opening the dashboard on consecutive days grows it; missing a day starts again at 1.
 */
import { addDays, todayISO } from './dates';

export interface Streak { count: number; best: number; last: string }

export function touchStreak(userId: string): Streak {
  const key = `cardinal.streak.${userId}`;
  const today = todayISO();
  let s: Streak = { count: 0, best: 0, last: '' };
  try {
    s = { ...s, ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    /* ignore */
  }
  if (s.last !== today) {
    s.count = s.last === addDays(today, -1) ? s.count + 1 : 1;
    s.last = today;
    s.best = Math.max(s.best, s.count);
    localStorage.setItem(key, JSON.stringify(s));
  }
  return s;
}
