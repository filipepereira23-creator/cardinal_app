import { CATEGORIES } from '../data/categories';
import { convert, type CurrencyCode } from '../config/currencies';
import { typeById } from '../data/holdingTypes';
import { categoryValue, holdingValue, lastUpdated, positionValue, sortValuations, totalValue } from '../domain/calc';
import { todayISO } from '../domain/dates';
import type { Holding } from '../domain/types';

/**
 * Excel export in Cardinal style (Filipe, 18 Nov 2026): white sheets, red #DB0011 header rows with
 * white bold text, a "Cardinal" title row, never any gridlines, numbers as 1,234.56. Four sheets.
 * ExcelJS is loaded only when someone exports, so it doesn't slow the app down.
 */
const RED = 'FFDB0011';
const INK = 'FF1D1D1F';
const MUTED = 'FF8A8A8E';
const LINE = 'FFECECEE';
const FONT = 'Arial';
const NUM = '#,##0.00';

type Cell = string | number | null;
interface SheetSpec { name: string; subtitle: string; head: string[]; rows: Cell[][]; widths: number[]; money: number[]; total?: Cell[] }

export async function buildWorkbook(holdings: Holding[], ccy: CurrencyCode, who: string) {
  const { default: ExcelJS } = await import('exceljs');
  const today = todayISO();
  const cat = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const dateText = new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const sub = `${who ? who + ' · ' : ''}${dateText} · Values in ${ccy}`;

  const sheets: SheetSpec[] = [
    {
      name: 'Summary', subtitle: sub, head: ['Category', `Value (${ccy})`], widths: [30, 22], money: [1],
      rows: CATEGORIES.map((c) => [c.label, r2(categoryValue(holdings, c.id, ccy))]),
      total: ['Total Net Worth', r2(totalValue(holdings, ccy))],
    },
    {
      name: 'Accounts And Assets', subtitle: sub, head: ['Name', 'Category', 'Type', 'Currency', 'Value (Own Currency)', `Value (${ccy})`, 'Last Updated', 'Notes'],
      widths: [34, 14, 28, 11, 22, 18, 15, 32], money: [4, 5],
      rows: holdings.map((h) => {
        const sign = h.category === 'debts' ? -1 : 1;
        const own = Math.abs(holdingValue(h, h.currency as CurrencyCode)) * sign;
        return [h.name, cat(h.category), typeById(h.type)?.label ?? h.type, h.currency, r2(own), r2(holdingValue(h, ccy)), lastUpdated(h) ?? '', h.notes ?? ''];
      }),
    },
    {
      name: 'Positions', subtitle: sub, head: ['Account', 'Position', 'Symbol', 'Quantity', `Value (${ccy})`], widths: [34, 34, 12, 14, 18], money: [4],
      rows: holdings.flatMap((h) => h.positions.map((p) => [h.name, p.name, p.symbol ?? '', p.quantity ?? null, r2(positionValue(p, h, ccy))] as Cell[])),
    },
    {
      name: 'Value History', subtitle: sub, head: ['Account', 'Date', 'Value (Own Currency)', 'Currency', `Value (${ccy})`], widths: [34, 14, 22, 11, 18], money: [2, 4],
      rows: holdings.flatMap((h) => sortValuations(h.valuations).map((v) => [h.name, v.date, r2(v.value), h.currency, r2(convert(v.value, h.currency, ccy))] as Cell[])),
    },
  ];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cardinal';
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name, { views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }], properties: { defaultRowHeight: 18 } });
    ws.columns = s.widths.map((width) => ({ width }));
    const n = s.head.length;
    // Row 1: title. Row 2: who, date and currency. Row 3: spacer. Row 4: red header.
    const t = ws.getCell(1, 1); t.value = 'Cardinal'; t.font = { name: FONT, size: 18, bold: true, color: { argb: RED } };
    ws.getRow(1).height = 28;
    const st = ws.getCell(2, 1); st.value = s.subtitle; st.font = { name: FONT, size: 10, color: { argb: MUTED } };
    ws.getRow(3).height = 8;
    const hr = ws.getRow(4); hr.height = 22;
    s.head.forEach((h, i) => {
      const c = hr.getCell(i + 1);
      c.value = h;
      c.font = { name: FONT, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
      c.alignment = { vertical: 'middle', horizontal: s.money.includes(i) || i === 3 && s.name === 'Positions' ? 'right' : 'left', indent: 1 };
    });
    const body = s.total ? [...s.rows, s.total] : s.rows;
    body.forEach((r, ri) => {
      const row = ws.getRow(5 + ri);
      const isTotal = !!s.total && ri === body.length - 1;
      r.forEach((v, i) => {
        const c = row.getCell(i + 1);
        c.value = v === '' ? null : v;
        c.font = { name: FONT, size: 11, bold: isTotal, color: { argb: isTotal ? RED : INK } };
        c.alignment = { vertical: 'middle', horizontal: typeof v === 'number' ? 'right' : 'left', indent: 1 };
        if (typeof v === 'number') c.numFmt = s.money.includes(i) ? NUM : '#,##0.########';
        c.border = isTotal ? { top: { style: 'thin', color: { argb: RED } } } : { bottom: { style: 'thin', color: { argb: LINE } } };
      });
      for (let i = r.length; i < n; i++) row.getCell(i + 1).border = { bottom: { style: 'thin', color: { argb: LINE } } };
      row.height = 20;
    });
    if (!body.length) { const c = ws.getCell(5, 1); c.value = 'Nothing here yet'; c.font = { name: FONT, size: 11, italic: true, color: { argb: MUTED } }; }
  }
  return { wb, filename: `cardinal-export-${today}.xlsx` };
}

/** Builds the Excel workbook of everything in Cardinal and downloads it. Values are shown in the display currency. */
export async function downloadExcel(holdings: Holding[], ccy: CurrencyCode, who: string) {
  const { wb, filename } = await buildWorkbook(holdings, ccy, who);
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
