import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { MainTabs } from '../components/MainTabs';
import { Icon } from '../components/Icon';
import { totalChange } from '../domain/calc';
import { addDays, todayISO } from '../domain/dates';
import { uid } from '../storage/local';

/**
 * Connections: friends, groups and rankings.
 *
 * Privacy rule (Filipe, 18 Nov 2026): never show anyone's amounts. Rankings use % growth,
 * or the order of money made with the amount hidden. Each person chooses whether to take
 * part. People who opt out still get end of week, month and year reports.
 *
 * Until the server exists (to-do 1) friends and groups are saved on this device and invites
 * wait to go out. Example friends can be loaded to see how it looks.
 */

type Period = 'week' | 'month' | 'year';
type RankBy = 'pct' | 'money';

interface Friend { id: string; name: string; email: string; example?: boolean; /** % growth for week, month, year (examples only). */ pct?: [number, number, number]; /** Rank weight for money made, never shown. */ gain?: [number, number, number]; }
interface Group { id: string; name: string; members: string[]; }
interface ConnState { optIn: boolean; friends: Friend[]; groups: Group[]; }

const PERIODS: { id: Period; label: string; days: number; report: string }[] = [
  { id: 'week', label: 'Week', days: 7, report: 'End Of Week' },
  { id: 'month', label: 'Month', days: 30, report: 'End Of Month' },
  { id: 'year', label: 'Year', days: 365, report: 'End Of Year' },
];
const IDX: Record<Period, number> = { week: 0, month: 1, year: 2 };

const EXAMPLES: Friend[] = [
  { id: 'ex-maria', name: 'Maria Costa', email: 'maria@example.com', example: true, pct: [2.4, 4.1, 21.3], gain: [3, 2, 4] },
  { id: 'ex-tom', name: 'Tom Hughes', email: 'tom@example.com', example: true, pct: [0.8, 3.2, 12.6], gain: [5, 6, 6] },
  { id: 'ex-ade', name: 'Ade Okafor', email: 'ade@example.com', example: true, pct: [1.9, 6.5, 18.9], gain: [2, 4, 3] },
  { id: 'ex-giulia', name: 'Giulia Rossi', email: 'giulia@example.com', example: true, pct: [-0.6, 1.1, 9.4], gain: [1, 1, 2] },
  { id: 'ex-sam', name: 'Sam Patel', email: 'sam@example.com', example: true, pct: [3.1, 2.7, 15.2], gain: [6, 5, 5] },
  { id: 'ex-ines', name: 'Inês Ferreira', email: 'ines@example.com', example: true, pct: [0.3, 5.0, 26.8], gain: [4, 3, 1] },
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

export function ConnectionsPage() {
  const { user, holdings } = useStore();
  const [st, setSt] = useState<ConnState>(() => load(user?.id ?? 'anon'));
  const [period, setPeriod] = useState<Period>('month');
  const [rankBy, setRankBy] = useState<RankBy>('pct');
  const [scope, setScope] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', email: '' });
  const [newGroup, setNewGroup] = useState<{ name: string; members: string[] } | null>(null);

  useEffect(() => { if (user) localStorage.setItem(key(user.id), JSON.stringify(st)); }, [st, user]);

  // My own growth per period, from my history. Only the % ever leaves this screen.
  const mine = useMemo(() => {
    const out: Record<Period, { pct: number | null; abs: number }> = {} as never;
    for (const p of PERIODS) {
      const c = totalChange(holdings, 'GBP', addDays(todayISO(), -p.days));
      out[p.id] = { pct: c.pct, abs: c.abs };
    }
    return out;
  }, [holdings]);

  const groupMembers = scope === 'all' ? st.friends.map((x) => x.id) : st.groups.find((g) => g.id === scope)?.members ?? [];
  const people = st.friends.filter((x) => groupMembers.includes(x.id));

  const board = (p: Period, includeMe: boolean, by: RankBy): Entry[] => {
    const i = IDX[p];
    const rows: Entry[] = people.filter((x) => x.pct).map((x) => ({ id: x.id, name: x.name, pct: x.pct![i], weight: by === 'pct' ? x.pct![i] : x.gain![i] }));
    if (includeMe) {
      const m = mine[p];
      // For "money made" I slot in by my own gain against the examples' scale; the amount is never displayed.
      const meWeight = by === 'pct' ? (m.pct ?? -Infinity) : m.abs > 0 ? 3.5 : 0;
      rows.push({ id: 'me', name: 'You', me: true, pct: m.pct, weight: meWeight });
    }
    return rows.sort((a, b) => b.weight - a.weight);
  };

  const ranking = board(period, st.optIn, rankBy);
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

      <section className="card conn-hero">
        <div className="eyebrow">Your Flock</div>
        <h2 className="conn-title">Grow Together, Privately</h2>
        <p className="muted">Add friends, make groups and see who is growing fastest. Cardinal only ever shares percentages. Nobody ever sees how much anyone has or made</p>
        <label className="toggle-row conn-optin">
          <span className="toggle-text">
            <span><b>Take Part In Rankings</b></span>
            <span className="muted small">{st.optIn ? 'Your % growth shows in your groups. Your amounts never do' : 'You are hidden from rankings. You still get the end of week, month and year reports'}</span>
          </span>
          <input type="checkbox" role="switch" className="switch" checked={st.optIn} onChange={(e) => setSt((s) => ({ ...s, optIn: e.target.checked }))} />
        </label>
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
            <div className="eyebrow">Rankings</div>
            <div className="seg" role="radiogroup" aria-label="Period">
              {PERIODS.map((p) => <button key={p.id} type="button" role="radio" aria-checked={period === p.id} className={period === p.id ? 'on' : ''} onClick={() => setPeriod(p.id)}>{p.label}</button>)}
            </div>
          </div>
          <div className="seg conn-by" role="radiogroup" aria-label="Rank by">
            <button type="button" role="radio" aria-checked={rankBy === 'pct'} className={rankBy === 'pct' ? 'on' : ''} onClick={() => setRankBy('pct')}>% Growth</button>
            <button type="button" role="radio" aria-checked={rankBy === 'money'} className={rankBy === 'money' ? 'on' : ''} onClick={() => setRankBy('money')}>Money Made</button>
          </div>
          {ranking.length <= 1 ? (
            <p className="muted">Rankings appear once friends join. {pending.length > 0 ? 'Your invites go out when accounts sync across devices' : 'Add a friend or load the examples above'}</p>
          ) : (
            <ol className="rank">
              {ranking.map((r, i) => (
                <li key={r.id} className={r.me ? 'me' : ''}>
                  <span className={`rank-pos ${i < 3 ? `top${i + 1}` : ''}`}>{i + 1}</span>
                  <span className="conn-avatar">{r.me ? 'You' : initials(r.name)}</span>
                  <span className="rank-name">{r.name}</span>
                  {rankBy === 'pct'
                    ? <span className={`rank-val ${r.pct !== null && r.pct < 0 ? 'neg' : 'pos'}`}>{pctText(r.pct)}</span>
                    : <span className="rank-val muted"><Icon name="lock" size={12} /> Amount hidden</span>}
                </li>
              ))}
            </ol>
          )}
          <p className="muted small">{rankBy === 'pct' ? 'Ranked by % growth over the period' : 'Ranked by money made over the period. The order shows, the amounts never do'}</p>
        </section>
      ) : null}

      <section className="card">
        <div className="eyebrow">Reports</div>
        <p className="muted small">{st.optIn ? 'Everyone gets these' : 'You are out of rankings, so this is your view'} Sent at the end of each week, month and year once the server is in. Percentages only</p>
        <div className="report-grid">
          {PERIODS.map((p) => {
            const top = board(p.id, st.optIn, 'pct');
            const money = board(p.id, st.optIn, 'money');
            return (
              <div key={p.id} className="report">
                <div className="report-title">{p.report}</div>
                {top.length <= 1 ? <p className="muted small">Waiting for friends</p> : (
                  <>
                    <div className="report-line"><span className="muted small">Grew most</span><b>{top[0].name}</b><span className="pos">{pctText(top[0].pct)}</span></div>
                    <div className="report-line"><span className="muted small">Made most</span><b>{money[0].name}</b><span className="muted small"><Icon name="lock" size={11} /> hidden</span></div>
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
