import * as XLSX from 'xlsx';
import { CATEGORIES } from '../data/categories';
import { convert, type CurrencyCode } from '../config/currencies';
import { categoryValue, holdingValue, positionValue, sortValuations, totalValue } from '../domain/calc';
import { todayISO } from '../domain/dates';
import type { Holding } from '../domain/types';

/** Builds an Excel workbook of everything in Cardinal and downloads it. Values are shown in the display currency. */
export function downloadExcel(holdings: Holding[], ccy: CurrencyCode, who: string) {
  const today = todayISO();
  const cat = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const summary: (string | number)[][] = [
    ['Cardinal export'],
    ['Account', who],
    ['Date', today],
    ['Display currency', ccy],
    [],
    ['Category', `Value (${ccy})`],
    ...CATEGORIES.map((c) => [c.label, r2(categoryValue(holdings, c.id, ccy))]),
    ['Total net worth', r2(totalValue(holdings, ccy))],
  ];

  const accounts = [
    ['Name', 'Category', 'Type', 'Currency', 'Value (own currency)', `Value (${ccy})`, 'Last updated', 'Notes'],
    ...holdings.map((h) => {
      const vs = sortValuations(h.valuations);
      const own = vs.length ? vs[vs.length - 1].value : 0;
      return [h.name, cat(h.category), h.type, h.currency, r2(own), r2(holdingValue(h, ccy)), vs.length ? vs[vs.length - 1].date : '', h.notes ?? ''];
    }),
  ];

  const positions: (string | number)[][] = [['Account', 'Position', 'Symbol', 'Quantity', `Value (${ccy})`]];
  holdings.forEach((h) => h.positions.forEach((p) => positions.push([h.name, p.name, p.symbol ?? '', p.quantity ?? '', r2(positionValue(p, h, ccy))])));

  const history: (string | number)[][] = [['Account', 'Date', 'Value (own currency)', 'Currency', `Value (${ccy})`]];
  holdings.forEach((h) => sortValuations(h.valuations).forEach((v) => history.push([h.name, v.date, r2(v.value), h.currency, r2(convert(v.value, h.currency, ccy))])));

  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: (string | number)[][], widths: number[]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add('Summary', summary, [24, 22]);
  add('Accounts and assets', accounts, [30, 16, 18, 10, 22, 18, 14, 30]);
  add('Positions', positions, [30, 30, 12, 12, 18]);
  add('History', history, [30, 12, 22, 10, 18]);
  XLSX.writeFile(wb, `cardinal-export-${today}.xlsx`);
}
