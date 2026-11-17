/**
 * Property value from floor area × local £ per square metre (London only for now).
 * Source: src/data/londonPsm.ts (HM Land Registry sold prices matched to EPC floor areas).
 * It is a suggestion the user can apply; they can always type their own value instead.
 */
import type { Holding } from '../domain/types';
import { LONDON_PSM, LONDON_PSM_AS_OF } from '../data/londonPsm';

export interface AreaEstimate {
  district: string;
  area: string;
  psm: number;
  sqm: number;
  value: number;
  sales: number;
  asOf: string;
}

export type AreaLookup = { kind: 'ok'; est: AreaEstimate } | { kind: 'no-postcode' } | { kind: 'no-area' } | { kind: 'not-london'; district: string } | { kind: 'no-figure'; district: string };

/** "sw5 0jq" → "SW5"; "SW1A" stays "SW1A". */
export function outwardCode(postcode: string): string {
  const pc = postcode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return pc.length >= 5 ? pc.slice(0, -3) : pc;
}

export function parseSqm(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/,/g, '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function areaLookup(details: Record<string, string> | undefined): AreaLookup {
  const pc = details?.postcode?.trim();
  if (!pc) return { kind: 'no-postcode' };
  const district = outwardCode(pc);
  const row = LONDON_PSM[district];
  if (!row) return { kind: 'not-london', district };
  if (row[0] === null) return { kind: 'no-figure', district };
  const sqm = parseSqm(details?.sqm);
  if (!sqm) return { kind: 'no-area' };
  return { kind: 'ok', est: { district, area: row[1] || 'London', psm: row[0], sqm, value: Math.round((row[0] * sqm) / 1000) * 1000, sales: row[2], asOf: LONDON_PSM_AS_OF } };
}

export const areaLookupForHolding = (h: Pick<Holding, 'details'>) => areaLookup(h.details);
