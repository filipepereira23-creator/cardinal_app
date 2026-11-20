import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { MainTabs } from '../components/MainTabs';
import { Icon } from '../components/Icon';
import { totalChange } from '../domain/calc';
import { addDays, todayISO } from '../domain/dates';
import { uid } from '../storage/local';
import { BirdFace } from '../components/BirdReaction';
import { useAvatar } from '../components/Avatar';
import { holdingValue } from '../domain/calc';
import { Money } from '../components/Money';

/**
 * Connections: friends, groups and rankings.
 *
 * Privacy rule (Filipe, 18 Nov 2026): never show anyone's amounts. Rankings use % growth only.
 * 20 Nov 2026: rankings cover investments only. You pick which investment accounts (e.g. Trading 212)
 * count, and your % change is worked out from those accounts alone. No Money Made ranking.
 * Friends can react to each other's results with a happy or a sad cardinal. Each person chooses whether to take
 * part. People who opt out still get end of week, month and year reports.
 *
 * Until the server exists (to-do 1) friends and groups are saved on this device and invites
 * wait to go out. Example friends can be loaded to see how it looks.
 */

type Period = 'week' | 'month' | 'year';
type Mood = 'happy' | 'sad';

interface Friend { id: string; name: string; email: string; example?: boolean; /** % growth for week, month, year (examples only). */ pct?: [number, number, number]; }
interface Group { id: string; name: string; members: string[]; }
interface ConnState { optIn: boolean; friends: Friend[]; groups: Group[]; /** Investment account ids that count in my ranking. */ accounts?: string[]; /** My reactions, keyed friendId:period. */ reactions?: Record<string, Mood>; }

const PERIODS: { id: Period; label: string; days: number; report: string }[] = [
  { id: 'week', label: 'Week', days: 7, report: 'End Of Week' },
  { id: 'month', label: 'Month', days: 30, report: 'End Of Month' },
  { id: 'year', label: 'Year', days: 365, report: 'End Of Year' },
];
const IDX: Record<Period, number> = { week: 0, month: 1, year: 2 };

const EXAMPLES: Friend[] = [
  { id: 'ex-maria', name: 'Maria Costa', email: 'maria@example.com', example: true, pct: [2.4, 4.1, 21.3] },
  { id: 'ex-tom', name: 'Tom Hughes', email: 'tom@example.com', example: true, pct: [0.8, 3.2, 12.6] },
  { id: 'ex-ade', name: 'Ade Okafor', email: 'ade@example.com', example: true, pct: [1.9, 6.5, 18.9] },
  { id: 'ex-giulia', name: 'Giulia Rossi', email: 'giulia@example.com', example: true, pct: [-0.6, 1.1, 9.4] },
  { id: 'ex-sam', name: 'Sam Patel', email: 'sam@example.com', example: true, pct: [3.1, 2.7, 15.2] },
  { id: 'ex-ines', name: 'Inês Ferreira', email: 'ines@example.com', example: true, pct: [0.3, 5.0, 26.8] },
];
const EXAMPLE_GROUPS: Group[] = [
  { id: 'exg-flat', name: 'Clapham flat', members: ['ex-maria', 'ex-tom', 'ex-giulia'] },
  { id: 'exg-work', name: 'Work lot', members: ['ex-ade', 'ex-sam', 'ex-ines', 'ex-tom'] },
];

const key = (userId: string) => `cardinal.connections.v1.${userId}`;
function load(userId: string): ConnState {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) return JSON.parse(raw) as ConnState;
  } catch { /* ignore */ }
  return { optIn: true, friends: [], groups: [] };
}

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const pctText = (v: number | null) => (v === null ? 'n/a' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`);

interface Entry { id: string; name: string; me?: boolean; pct: number | null; weight: number; }

/** Example friends' reaction counts from others, so the feature looks alive. Mine are added on top. */
const baseCount = (key: string, mood: Mood) => { let h = 0; for (const c of key + mood) h = (h * 31 + c.charCodeAt(0)) % 7; return h % 4; };

export function ConnectionsPage() {
  const { user, holdings, currency } = useStore();
  const photo = useAvatar(user?.id);
  const [st, setSt] = useState<ConnState>(() => load(user?.id ?? 'anon'));
  const [ask, setAsk] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [scope, setScope] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', email: '' });
  const [newGroup, setNewGroup] = useState<{ name: string; members: string[] } | null>(null);

  useEffect(() => { if (user) localStorage.setItem(key(user.id), JSON.stringify(st)); }, [st, user]);

  // Only my investment accounts count, and only the ones I pick. Only the % ever leaves this screen.
  const investAccounts = useMemo(() => holdings.filter((h) => h.category === 'investment'), [holdings]);
  const picked = (st.accounts ?? []).filter((id) => investAccounts.some((h) => h.id === id));
  const pickedHoldings = useMemo(() => investAccounts.filter((h) => picked.includes(h.id)), [investAccounts, picked.join()]);
  const mine = useMemo(() => {
    const out: Record<Period, { pct: number | null }> = {} as never;
    for (const p of PERIODS) {
      out[p.id] = { pct: pickedHoldings.length ? totalChange(pickedHoldings, 'GBP', addDays(todayISO(), -p.days)).pct : null };
    }
    return out;
  }, [pickedHoldings]);
  const toggleAccount = (id: string) => setSt((s0) => {
    const cur = s0.accounts ?? [];
    return { ...s0, accounts: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
  });
  const react = (friendId: string, mood: Mood) => setSt((s0) => {
    const k = `${friendId}:${period}`;
    const r = { ...(s0.reactions ?? {}) };
    if (r[k] === mood) delete r[k]; else r[k] = mood;
    return { ...s0, reactions: r };
  });

  const groupMembers = scope === 'all' ? st.friends.map((x) => x.id) : st.groups.find((g) => g.id === scope)?.members ?? [];
  const people = st.friends.filter((x) => groupMembers.includes(x.id));

  const board = (p: Period, includeMe: boolean): Entry[] => {
    const i = IDX[p];
    const rows: Entry[] = people.filter((x) => x.pct).map((x) => ({ id: x.id, name: x.name, pct: x.pct![i], weight: x.pct![i] }));
    if (includeMe && picked.length > 0) {
      const m = mine[p];
      rows.push({ id: 'me', name: 'You', me: true, pct: m.pct, weight: m.pct ?? -Infinity });
    }
    return rows.sort((a, b) => b.weight - a.weight);
  };

  const ranking = board(period, st.optIn);
  const pending = st.friends.filter((x) => !x.example);
  const hasExamples = st.friends.some((x) => x.example);

  const addFriend = () => {
    if (!f.name.trim()) return;
    setSt((s) => ({ ...s, friends: [...s.friends, { id: uid(), name: f.name.trim(), email: f.email.trim() }] }));
    setF({ name: '', email: '' });
    setAdding(false);
  };
  const removeFriend = (id: string) => setSt((s) => ({ ...s, friends: s.friends.filter((x) => x.id !== id), groups: s.groups.map((g) => ({ ...g, members: g.members.filter((m) => m !== id) })) }));
  const loadExamples = () => setSt((s) => ({ ...s, friends: [...s.friends.filter((x) => !x.example), ...EXAMPLES], groups: [...s.groups.filter((g) => !g.id.startsWith('exg-')), ...EXAMPLE_GROUPS] }));
  const clearExamples = () => { setSt((s) => ({ ...s, friends: s.friends.filter((x) => !x.example), groups: s.groups.filter((g) => !g.id.startsWith('exg-')) })); setScope('all'); };
  const saveGroup = () => {
    if (!newGroup?.name.trim()) return;
    const g = { id: uid(), name: newGroup.name.trim(), members: newGroup.members };
    setSt((s) => ({ ...s, groups: [...s.groups, g] }));
    setNewGroup(null);
    setScope(g.id);
  };

  return (
    <div className="page connections">
      <MainTabs active="connections" />

      {ask && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setAsk(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{st.optIn ? 'Step Out Of Rankings?' : 'Join The Rankings?'}</h3>
            {st.optIn ? (
              <p className="muted">You will be hidden from the rankings in your groups. You still get your end of week, month and year reports, and you can join again any time</p>
            ) : (
              <p className="muted">Your friends and groups will see the % change of the investment accounts you pick, next to theirs. Nobody ever sees your balances or how much you made. You can step out any time from this same button</p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAsk(false)}>Not Now</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setSt((x) => ({ ...x, optIn: !x.optIn })); setAsk(false); }}>{st.optIn ? 'Step Out' : 'Yes, Join'}</button>
            </div>
          </div>
        </div>
      )}

      <section className="card conn-hero">
        <div className="eyebrow">Your Flock</div>
        <h2 className="conn-title">Grow Together, Privately</h2>
        <p className="muted">Add friends, make groups and see who is growing fastest. Rankings only look at investments, and Cardinal only ever shares percentages. Nobody ever sees how much anyone has or made</p>
        <div className="conn-optin">
          <button type="button" className={`btn btn-sm ${st.optIn ? 'btn-outline' : 'btn-primary'}`} onClick={() => setAsk(true)}>{st.optIn ? 'Rankings: On' : 'Join Rankings'}</button>
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">Your Investment Accounts</div>
        <p className="muted small">Rankings only count investments. Pick the accounts that count, like your Trading 212 account. Your % change comes from those accounts alone</p>
        {investAccounts.length === 0 ? (
          <div className="conn-empty">
            <p className="muted">No investment accounts yet. Connect one, for example Trading 212, to take part</p>
            <a className="btn btn-primary btn-sm" href="#/dashboard/investment">Connect An Investment Account</a>
          </div>
        ) : (
          <div className="conn-pick-acc">
            {investAccounts.map((h) => (
              <label key={h.id} className="conn-acc">
                <input type="checkbox" checked={picked.includes(h.id)} onChange={() => toggleAccount(h.id)} />
                <span className="grow">{h.name}</span>
                <Money value={holdingValue(h, currency)} ccy={currency} decimals={false} />
              </label>
            ))}
            <a className="link-btn" href="#/dashboard/investment">Connect Another Investment Account</a>
          </div>
        )}
        {investAccounts.length > 0 && picked.length === 0 && <p className="muted small">Pick at least one account to appear in the rankings</p>}
      </section>

      <section className="card">
        <div className="conn-head">
          <div className="eyebrow">Friends</div>
          <button className="btn btn-outline btn-sm" onClick={() => setAdding((a) => !a)}><Icon name="plus" size={14} /> Add friend</button>
        </div>
        {adding && (
          <div className="conn-form">
            <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <button className="btn btn-primary btn-sm" onClick={addFriend} disabled={!f.name.trim()}>Send invite</button>
          </div>
        )}
        {st.friends.length === 0 ? (
          <div className="conn-empty">
            <p className="muted">No friends yet. Invite people you trust, or load example friends to see how rankings look</p>
            <button className="btn btn-ghost btn-sm" onClick={loadExamples}><Icon name="sparkle" size={14} /> Show example friends</button>
          </div>
        ) : (
          <ul className="rows compact">
            {st.friends.map((x) => (
              <li key={x.id}>
                <div className="row">
                  <span className="conn-avatar">{initials(x.name)}</span>
                  <span className="row-main"><span className="row-title">{x.name}</span><span className="row-sub">{x.example ? 'Example friend' : 'Invite saved. Goes out when accounts sync'}</span></span>
                  <button className="icon-btn" aria-label={`Remove ${x.name}`} onClick={() => removeFriend(x.id)}><Icon name="close" size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {hasExamples && <button className="btn btn-ghost btn-sm" onClick={clearExamples}>Remove example friends</button>}
      </section>

      <section className="card">
        <div className="conn-head">
          <div className="eyebrow">Groups</div>
          <button className="btn btn-outline btn-sm" disabled={st.friends.length === 0} onClick={() => setNewGroup({ name: '', members: [] })}><Icon name="plus" size={14} /> New group</button>
        </div>
        {newGroup && (
          <div className="conn-form col">
            <input className="input" placeholder="Group name, e.g. Uni friends" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
            <div className="conn-pick">
              {st.friends.map((x) => {
                const on = newGroup.members.includes(x.id);
                return <button key={x.id} type="button" className={`chip ${on ? 'on' : ''}`} onClick={() => setNewGroup({ ...newGroup, members: on ? newGroup.members.filter((m) => m !== x.id) : [...newGroup.members, x.id] })}>{x.name}</button>;
              })}
            </div>
            <div><button className="btn btn-primary btn-sm" onClick={saveGroup} disabled={!newGroup.name.trim()}>Create group</button> <button className="btn btn-ghost btn-sm" onClick={() => setNewGroup(null)}>Cancel</button></div>
          </div>
        )}
        <div className="conn-pick">
          <button type="button" className={`chip ${scope === 'all' ? 'on' : ''}`} onClick={() => setScope('all')}>All friends</button>
          {st.groups.map((g) => <button key={g.id} type="button" className={`chip ${scope === g.id ? 'on' : ''}`} onClick={() => setScope(g.id)}>{g.name} · {g.members.length + 1}</button>)}
        </div>
      </section>

      {st.optIn ? (
        <section className="card">
          <div className="conn-head">
            <div className="eyebrow">Investment Rankings</div>
            <div className="seg" role="radiogroup" aria-label="Period">
              {PERIODS.map((p) => <button key={p.id} type="button" role="radio" aria-checked={period === p.id} className={period === p.id ? 'on' : ''} onClick={() => setPeriod(p.id)}>{p.label}</button>)}
            </div>
          </div>
          {ranking.length <= 1 ? (
            <p className="muted">Rankings appear once friends join and you have picked an investment account. {pending.length > 0 ? 'Your invites go out when accounts sync across devices' : 'Add a friend or load the examples above'}</p>
          ) : (
            <ol className="rank">
              {ranking.map((r, i) => (
                <li key={r.id} className={r.me ? 'me' : ''}>
                  <span className={`rank-pos ${i < 3 ? `top${i + 1}` : ''}`}>{i + 1}</span>
                  <span className="conn-avatar">{r.me ? (photo ? <img src={photo} alt="" /> : 'You') : initials(r.name)}</span>
                  <span className="rank-name">{r.name}</span>
                  <span className={`rank-val ${r.pct !== null && r.pct < 0 ? 'neg' : 'pos'}`}>{pctText(r.pct)}</span>
                  {!r.me && (
                    <span className="react-bar">
                      {(['happy', 'sad'] as Mood[]).map((m) => {
                        const on = st.reactions?.[`${r.id}:${period}`] === m;
                        const ex = people.find((x) => x.id === r.id)?.example;
                        const n = (ex ? baseCount(r.id + period, m) : 0) + (on ? 1 : 0);
                        return (
                          <button key={m} type="button" className={`react-btn ${on ? 'on' : ''}`} aria-pressed={on} aria-label={`${m === 'happy' ? 'Happy' : 'Sad'} cardinal for ${r.name}`} onClick={() => react(r.id, m)}>
                            <BirdFace mood={m} size={22} />{n > 0 ? n : ''}
                          </button>
                        );
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="muted small">Ranked by the % change of investment accounts over the period. Tap a cardinal to cheer a friend on or to say better luck next time</p>
        </section>
      ) : null}

      <section className="card">
        <div className="eyebrow">Reports</div>
        <p className="muted small">{st.optIn ? 'Everyone gets these' : 'You are out of rankings, so this is your view'} Sent at the end of each week, month and year once the server is in. Investments and percentages only</p>
        <div className="report-grid">
          {PERIODS.map((p) => {
            const top = board(p.id, st.optIn);
            return (
              <div key={p.id} className="report">
                <div className="report-title">{p.report}</div>
                {top.length <= 1 ? <p className="muted small">Waiting for friends</p> : (
                  <>
                    <div className="report-line"><span className="muted small">Grew most</span><b>{top[0].name}</b><span className="pos">{pctText(top[0].pct)}</span></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
