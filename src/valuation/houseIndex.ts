/**
 * Property index estimate: HM Land Registry UK House Price Index (UKHPI), free and CORS-enabled.
 *   postcode → local authority (postcodes.io) → UKHPI for that area (latest month and the month
 *   of the user's last value) → last value × (index now / index then).
 * It is an area average for all property types and lags about two months, so it is offered as
 * an estimate the user can apply, never written automatically.
 */
import type { Holding } from '../domain/types';
import { sortValuations } from '../domain/calc';

export interface HpiEstimate {
  value: number;
  area: string;
  fromMonth: string;
  toMonth: string;
  indexFrom: number;
  indexTo: number;
  changePct: number;
  basedOn: { date: string; value: number };
  url: string;
}

const CACHE_KEY = 'cardinal.hpi.v1';
type Cache = Record<string, number | null>;
const readCache = (): Cache => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};
const writeCache = (c: Cache) => localStorage.setItem(CACHE_KEY, JSON.stringify(c));

function areaSlug(name: string): string {
  // "Bristol, City of" → "City of Bristol"
  const n = name.includes(', ') ? name.split(', ').reverse().join(' ') : name;
  return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function monthsBack(n: number, from = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - n, 1));
  return d.toISOString().slice(0, 7);
}

async function indexFor(slug: string, month: string): Promise<number | null> {
  const key = `${slug}|${month}`;
  const cache = readCache();
  // Only trust cached misses for months that are long settled.
  if (key in cache && (cache[key] !== null || month < monthsBack(4))) return cache[key];
  try {
    const res = await fetch(`https://landregistry.data.gov.uk/data/ukhpi/region/${slug}/month/${month}.json`);
    const j = res.ok ? await res.json() : null;
    const t = j?.result?.primaryTopic;
    const v = t && typeof t === 'object' && typeof t.housePriceIndex === 'number' ? (t.housePriceIndex as number) : null;
    cache[key] = v;
    writeCache(cache);
    return v;
  } catch {
    return null;
  }
}

async function latestFor(slug: string): Promise<{ month: string; index: number } | null> {
  for (let i = 1; i <= 6; i++) {
    const m = monthsBack(i);
    const v = await indexFor(slug, m);
    if (v !== null) return { month: m, index: v };
  }
  return null;
}

async function areasFor(postcode: string): Promise<{ slug: string; name: string }[]> {
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s+/g, ''))}`);
  if (!res.ok) return [];
  const r = (await res.json()).result;
  if (!r) return [];
  return [r.admin_district, r.region, r.country]
    .filter(Boolean)
    .map((n: string) => ({ slug: areaSlug(n), name: n }));
}

/** Estimate today's value of a property from its last recorded value and the local house price index. */
export async function hpiEstimate(h: Holding): Promise<HpiEstimate | null> {
  const pc = h.details?.postcode?.trim();
  const vals = sortValuations(h.valuations);
  const last = vals[vals.length - 1];
  if (!pc || !last) return null;
  for (const area of await areasFor(pc)) {
    const latest = await latestFor(area.slug);
    if (!latest) continue;
    const baseMonth = last.date.slice(0, 7) < latest.month ? last.date.slice(0, 7) : latest.month;
    const base = baseMonth === latest.month ? latest.index : await indexFor(area.slug, baseMonth);
    if (!base) continue;
    const value = Math.round((last.value * latest.index) / base);
    return {
      value,
      area: area.name,
      fromMonth: baseMonth,
      toMonth: latest.month,
      indexFrom: base,
      indexTo: latest.index,
      changePct: (latest.index / base - 1) * 100,
      basedOn: last,
      url: `https://landregistry.data.gov.uk/app/ukhpi/browse?location=http%3A%2F%2Flandregistry.data.gov.uk%2Fid%2Fregion%2F${area.slug}`,
    };
  }
  return null;
}
