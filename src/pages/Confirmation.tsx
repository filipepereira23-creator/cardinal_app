import { useStore } from '../state/store';
import { go } from '../state/router';
import { Bird } from '../components/Logo';
import { Icon } from '../components/Icon';

/** Shown right after registering. A real confirmation email arrives once there's a backend (src/integrations/email). */
export function Confirmation() {
  const { user, confirmationEmailSent } = useStore();
  return (
    <div className="page">
      <section className="card confirm-card">
        <div className="confirm-badge"><Bird size={72} /><span className="confirm-tick"><Icon name="check" size={18} /></span></div>
        <h1>You're in, {user?.firstName}.</h1>
        <p className="muted">Your Cardinal account has been created.</p>
        <dl className="confirm-details">
          <div><dt>Name</dt><dd>{user?.firstName} {user?.lastName}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
        </dl>
        <p className="notice small">
          <Icon name="mail" size={18} />
          {confirmationEmailSent
            ? <span>We've sent a confirmation email to <b>{user?.email}</b>.</span>
            : <span>Confirmation emails are coming soon. For now, this screen is your confirmation. Your data stays in this browser on this device.</span>}
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => go('dashboard')}>Go to my dashboard</button>
      </section>
    </div>
  );
}
