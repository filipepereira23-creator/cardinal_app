import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { go } from '../state/router';
import { MainTabs } from '../components/MainTabs';
import { Field } from '../components/Forms';
import { Icon } from '../components/Icon';
import { palette } from '../config/palette';
import { convert, formatMoney } from '../config/currencies';
import { DEFAULT_SAVINGS_RATE, TAX_YEAR, takeHome, yearlySavings, type IncomeProfile, type LoanPlan, type PensionMethod, type TaxRegion } from '../domain/ukTax';

/** Opens the forecast on the dashboard (read once by Dashboard). */
export const OPEN_FORECAST_KEY = 'cardinal.openForecast';

const LOANS: { id: LoanPlan; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'plan1', label: 'Plan 1' },
  { id: 'plan2', label: 'Plan 2' },
  { id: 'plan4', label: 'Plan 4 (Scotland)' },
  { id: 'plan5', label: 'Plan 5' },
  { id: 'postgrad', label: 'Postgraduate Loan Only' },
];

const num = (s: string) => {
  const n = parseFloat(s.replace(/[,£\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const str = (n?: number) => (n ? String(n) : '');
const gbp = (v: number, decimals = false) => formatMoney(v, 'GBP', { decimals });

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg seg-full" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

function Money2({ v }: { v: number }) {
  return <span className="money-in">{gbp(v)}</span>;
}

export function IncomePage() {
  const { income, setIncome, theme, currency } = useStore();
  const C = palette(theme);
  // Text fields keep what the user typed; the saved profile is updated on every change.
  const [salary, setSalary] = useState(str(income?.salary));
  const [bonus, setBonus] = useState(str(income?.bonus));
  const [pension, setPension] = useState(str(income?.pensionPct));
  const [method, setMethod] = useState<PensionMethod>(income?.pensionMethod ?? 'sacrifice');
  const [loan, setLoan] = useState<LoanPlan>(income?.loan ?? 'none');
  const [postgrad, setPostgrad] = useState(!!income?.postgrad);
  const [region, setRegion] = useState<TaxRegion>(income?.region ?? 'rUK');
  const [savings, setSavings] = useState(String(income?.savingsRate ?? DEFAULT_SAVINGS_RATE));
  const [saveMode, setSaveMode] = useState<'pct' | 'amount'>(income?.savingsMode ?? 'pct');
  const [saveAmt, setSaveAmt] = useState(income?.savingsAmount ? String(income.savingsAmount) : '');
  const [inForecast, setInForecast] = useState(income?.inForecast !== false);

  const profile: IncomeProfile | undefined = useMemo(() => {
    const s = num(salary);
    if (!(s > 0)) return undefined;
    return {
      salary: s,
      bonus: num(bonus) || undefined,
      pensionPct: Math.min(100, num(pension)) || undefined,
      pensionMethod: method,
      loan,
      postgrad: loan !== 'none' && loan !== 'postgrad' ? postgrad : undefined,
      region,
      savingsRate: Math.min(100, num(savings)),
      savingsMode: saveMode,
      savingsAmount: saveMode === 'amount' ? num(saveAmt) : undefined,
      inForecast,
    };
  }, [salary, bonus, pension, method, loan, postgrad, region, savings, saveMode, saveAmt, inForecast]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const same = JSON.stringify({ ...income, updatedAt: undefined }) === JSON.stringify({ ...profile, updatedAt: undefined });
      if (!same) setIncome(profile);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const r = profile ? takeHome(profile) : null;
  const saved = profile ? yearlySavings({ ...profile, inForecast: true }) : 0;
  const parts = r
    ? [
        { key: 'Take-Home Pay', v: r.takeHome, c: C[0] },
        { key: 'Income Tax', v: r.incomeTax, c: C[1] },
        { key: 'National Insurance', v: r.nationalInsurance, c: C[3] },
        { key: 'Pension', v: r.pension, c: C[2] },
        { key: 'Student Loan', v: r.studentLoan, c: C[6] },
      ]
    : [];

  const openForecast = () => {
    sessionStorage.setItem(OPEN_FORECAST_KEY, '1');
    go('dashboard');
  };

  return (
    <div className="page income">
      <MainTabs active="income" />

      <section className="card hero">
        <div className="eyebrow">Your Take-Home Pay</div>
        {r ? (
          <>
            <div className="hero-figure">{gbp(r.monthly, true)}<span className="income-per"> A Month</span></div>
            <div className="hero-split small">
              <span>Per Year <b>{gbp(r.takeHome, true)}</b></span>
              <span>From <b>{gbp(r.gross)}</b> Gross</span>
            </div>
            <p className="muted small">UK tax year {TAX_YEAR} ({region === 'scotland' ? 'Scottish' : 'England, Wales and Northern Ireland'} income tax)</p>
          </>
        ) : (
          <div className="empty income-empty">
            <h3>Add Your Yearly Income</h3>
            <p className="muted">Type in your salary below. Cardinal works out your take-home pay after UK tax and adds what you save to your forecast</p>
          </div>
        )}
      </section>

      {r && (
        <section className="card">
          <h2 className="income-h">Where Your Pay Goes</h2>
          <div className="income-strip" role="img" aria-label="Split of your gross pay">
            {parts.filter((p) => p.v > 0).map((p) => <i key={p.key} style={{ width: `${(p.v / r.gross) * 100}%`, background: p.c }} title={p.key} />)}
          </div>
          <table className="income-table">
            <thead>
              <tr><th></th><th>Per Year</th><th>Per Month</th></tr>
            </thead>
            <tbody>
              <tr className="income-gross"><td>Gross Pay</td><td>{gbp(r.gross)}</td><td>{gbp(r.gross / 12)}</td></tr>
              {parts.slice(1).map((p) => (
                <tr key={p.key} className={p.v === 0 ? 'zero' : ''}>
                  <td><i style={{ background: p.c }} />{p.key}</td>
                  <td>{p.v > 0 ? '−' : ''}{gbp(p.v)}</td>
                  <td>{p.v > 0 ? '−' : ''}{gbp(p.v / 12)}</td>
                </tr>
              ))}
              <tr className="income-net"><td><i style={{ background: parts[0].c }} />Take-Home Pay</td><td>{gbp(r.takeHome)}</td><td>{gbp(r.monthly)}</td></tr>
            </tbody>
          </table>
          <details className="income-more">
            <summary>How Your Tax Is Worked Out</summary>
            <ul>
              <li>Tax-free Personal Allowance: <b>{gbp(r.personalAllowance)}</b>{r.personalAllowance < 12570 ? ' (reduced by £1 for every £2 over £100,000)' : ''}</li>
              {r.bands.map((b) => <li key={b.rate}>{Math.round(b.rate * 100)}% on <Money2 v={b.amount} /> = <b>{gbp(b.tax)}</b></li>)}
              <li>National Insurance: 8% between £12,570 and £50,270, 2% above</li>
              {r.pension > 0 && <li>Pension by {method === 'sacrifice' ? 'salary sacrifice: taken before tax, National Insurance and student loan' : 'net pay: taken before tax, after National Insurance'}</li>}
              <li>Your next £100 of salary keeps <b>{gbp(100 * (1 - r.marginal))}</b> after tax{r.studentLoan > 0 ? ', National Insurance and student loan' : ' and National Insurance'}</li>
            </ul>
            <p className="muted small">Assumes a standard 1257L tax code with pay spread evenly over the year. Bonus months, benefits in kind and Child Benefit charges can change what lands in a given month</p>
          </details>
        </section>
      )}

      <section className="card settings-section">
        <h2 className="income-h">Your Income</h2>
        <div className="income-grid">
          <Field label="Yearly salary (before tax)">
            <div className="amount-input"><span>£</span><input inputMode="decimal" placeholder="0" value={salary} onChange={(e) => setSalary(e.target.value)} aria-label="Yearly salary" /></div>
          </Field>
          <Field label="Yearly bonus (optional)">
            <div className="amount-input"><span>£</span><input inputMode="decimal" placeholder="0" value={bonus} onChange={(e) => setBonus(e.target.value)} aria-label="Yearly bonus" /></div>
          </Field>
        </div>
        <Field label="Where you pay income tax">
          <Seg label="Tax region" value={region} onChange={setRegion} options={[{ id: 'rUK', label: 'England, Wales & NI' }, { id: 'scotland', label: 'Scotland' }]} />
        </Field>
        <div className="income-grid">
          <Field label="Pension contribution (optional)" hint="Your own contribution, as % of pay">
            <div className="amount-input"><input inputMode="decimal" placeholder="0" value={pension} onChange={(e) => setPension(e.target.value)} aria-label="Pension contribution percent" /><span>%</span></div>
          </Field>
          <Field label="Student loan">
            <select className="input" value={loan} onChange={(e) => setLoan(e.target.value as LoanPlan)} aria-label="Student loan plan">
              {LOANS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </Field>
        </div>
        {num(pension) > 0 && (
          <Field label="How your pension is paid" hint="Salary sacrifice also saves National Insurance. Check your payslip if unsure">
            <Seg label="Pension method" value={method} onChange={setMethod} options={[{ id: 'sacrifice', label: 'Salary Sacrifice' }, { id: 'netpay', label: 'Net Pay' }]} />
          </Field>
        )}
        {loan !== 'none' && loan !== 'postgrad' && (
          <label className="check-row">
            <input type="checkbox" checked={postgrad} onChange={(e) => setPostgrad(e.target.checked)} />
            <span>Also Repaying A Postgraduate Loan</span>
          </label>
        )}
        {profile && (
          <button className="link-btn income-clear" onClick={() => { setSalary(''); setBonus(''); setPension(''); setLoan('none'); setPostgrad(false); }}>
            Remove My Income
          </button>
        )}
      </section>

      <section className="card settings-section">
        <h2 className="income-h">In Your Forecast</h2>
        <Field label="How You Save" hint={saveMode === 'pct' ? 'The share of your take-home pay you save or invest each year' : 'The amount you save or invest each year, in pounds'}>
          <div className="seg" role="radiogroup" aria-label="Savings entry">
            <button type="button" role="radio" aria-checked={saveMode === 'pct'} className={saveMode === 'pct' ? 'on' : ''} onClick={() => setSaveMode('pct')}>Percentage</button>
            <button type="button" role="radio" aria-checked={saveMode === 'amount'} className={saveMode === 'amount' ? 'on' : ''} onClick={() => setSaveMode('amount')}>Amount In £</button>
          </div>
          {saveMode === 'pct' ? (
            <div className="income-rate">
              <input type="range" min={0} max={80} step={1} value={Math.min(80, num(savings))} onChange={(e) => setSavings(e.target.value)} aria-label="Savings rate slider" />
              <div className="amount-input"><input inputMode="decimal" value={savings} onChange={(e) => setSavings(e.target.value)} aria-label="Savings rate percent" /><span>%</span></div>
            </div>
          ) : (
            <div className="income-rate">
              <div className="amount-input"><span>£</span><input inputMode="decimal" placeholder="0" value={saveAmt} onChange={(e) => setSaveAmt(e.target.value)} aria-label="Yearly savings in pounds" /><span>A Year</span></div>
            </div>
          )}
          {r && <p className="muted small">{saveMode === 'pct' ? `That is ${gbp(saved)} a year` : `That is ${r.takeHome > 0 ? ((saved / r.takeHome) * 100).toFixed(1) : '0'}% of your take-home pay`}</p>}
        </Field>
        {r ? (
          <div className="forecast-note">
            <div>You save about <b>{gbp(saved)}</b> a year ({gbp(saved / 12)} a month){r.pension > 0 ? <> plus <b>{gbp(r.pension)}</b> into your pension</> : null}</div>
            {currency !== 'GBP' && <span className="muted small">About {formatMoney(convert(saved + r.pension, 'GBP', currency), currency, { decimals: false })} a year in {currency}</span>}
          </div>
        ) : (
          <p className="muted small">Add your salary above to see how much you save each year</p>
        )}
        <label className="toggle-row">
          <span className="toggle-text">
            <span>Include In My Forecast</span>
            <span className="muted small">Adds these savings to your net worth forecast every year</span>
          </span>
          <input type="checkbox" role="switch" className="switch" checked={inForecast} onChange={(e) => setInForecast(e.target.checked)} />
        </label>
        {r && inForecast && (
          <button className="btn btn-primary" onClick={openForecast}><Icon name="chart" size={16} /> See My Forecast</button>
        )}
      </section>
    </div>
  );
}
