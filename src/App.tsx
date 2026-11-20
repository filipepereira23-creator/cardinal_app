import { useEffect } from 'react';
import { useStore } from './state/store';
import { go, useRoute } from './state/router';
import { Welcome, SignIn, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { HoldingDetail } from './pages/HoldingDetail';
import { SettingsPage } from './pages/Settings';
import { PathPage } from './pages/Path';
import { ConnectionsPage } from './pages/Connections';
import { IncomePage } from './pages/Income';
import { Confirmation } from './pages/Confirmation';
import { InfoPage } from './pages/Info';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Bird } from './components/Logo';
import { useSwipeTabs } from './state/swipe';
import type { CategoryId } from './domain/types';

const CATS: CategoryId[] = ['cash', 'investment', 'crypto', 'assets', 'debts'];

export default function App() {
  const { ready, user, confirmationEmailSent } = useStore();
  const [page, arg] = useRoute();
  const authPage = !page || page === 'welcome' || page === 'login' || page === 'register';
  const infoPage = page === 'info';
  useSwipeTabs(!!user, page, arg);

  useEffect(() => {
    if (!ready) return;
    if (!user && !authPage && !infoPage) go('welcome');
    // Right after registering, land on the confirmation screen; otherwise the dashboard.
    if (user && authPage) go(confirmationEmailSent !== null ? 'confirmed' : 'dashboard');
  }, [ready, user, authPage, infoPage, confirmationEmailSent]);

  if (!ready) return <div className="splash"><Bird size={64} /></div>;

  if (!user) {
    if (page === 'login') return <SignIn />;
    if (page === 'register') return <Register />;
    if (infoPage) return <div className="app"><main><InfoPage id={arg} /></main><Footer /></div>;
    return <Welcome />;
  }

  let body;
  if (page === 'holding' && arg) body = <HoldingDetail id={arg} />;
  else if (page === 'path') body = <PathPage />;
  else if (page === 'connections') body = <ConnectionsPage />;
  else if (page === 'income') body = <IncomePage />;
  else if (page === 'settings') body = <SettingsPage />;
  else if (page === 'confirmed') body = <Confirmation />;
  else if (infoPage) body = <InfoPage id={arg} />;
  else body = <Dashboard tab={CATS.includes(arg as CategoryId) ? (arg as CategoryId) : 'cash'} />;

  return (
    <div className="app">
      <Header />
      <main>{body}</main>
      <Footer />
    </div>
  );
}
