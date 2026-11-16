import { useState } from 'react';
import { Logo, Bird } from '../components/Logo';
import { Footer } from '../components/Footer';
import { Field } from '../components/Forms';
import { go } from '../state/router';
import { useStore } from '../state/store';

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg">
      <header className="auth-top">
        <Logo size={30} />
      </header>
      <main className="auth-card">{children}</main>
      <Footer />
    </div>
  );
}

export function Welcome() {
  return (
    <AuthFrame>
      <Bird className="welcome-bird" />
      <h1 className="welcome-title">Welcome to Cardinal.</h1>
      <p className="muted center">See everything you own in one number, and watch it move.</p>
      <div className="stack">
        <button className="btn btn-primary btn-lg" onClick={() => go('login')}>Log in</button>
        <button className="btn btn-outline btn-lg" onClick={() => go('register')}>Register now</button>
      </div>
    </AuthFrame>
  );
}

export function SignIn() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <AuthFrame>
      <h1 className="auth-title">Sign in</h1>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          setBusy(true);
          try {
            await login(email, pw);
            go('dashboard');
          } catch (x: any) {
            setErr(x.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Field>
        <Field label="Password">
          <input className="input" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        {err && <p className="error">{err}</p>}
        <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
      </form>
      <p className="center small">
        Don't have an account? <a href="#/register">Register</a>
      </p>
    </AuthFrame>
  );
}

function strength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export function Register() {
  const { register } = useStore();
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const s = strength(f.password);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <AuthFrame>
      <h1 className="auth-title">Create an account</h1>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          if (f.password.length < 8) return setErr('Use at least 8 characters for your password.');
          setBusy(true);
          try {
            await register(f);
            go('confirmed');
          } catch (x: any) {
            setErr(x.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid-2">
          <Field label="First name">
            <input className="input" autoComplete="given-name" required value={f.firstName} onChange={set('firstName')} autoFocus />
          </Field>
          <Field label="Last name">
            <input className="input" autoComplete="family-name" required value={f.lastName} onChange={set('lastName')} />
          </Field>
        </div>
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Create password">
          <input className="input" type="password" autoComplete="new-password" required value={f.password} onChange={set('password')} />
          <span className="pw-meter" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < s ? `on s${s}` : ''} />
            ))}
          </span>
        </Field>
        {err && <p className="error">{err}</p>}
        <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="center small">
        Already have an account? <a href="#/login">Log in</a>
      </p>
    </AuthFrame>
  );
}
