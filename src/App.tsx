import { useEffect } from 'react';
import { useStore } from './state/store';
import { go, useRoute } from './state/router';
import { Welcome, SignIn, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { HoldingDetail } from './pages/HoldingDetail';
import { Header } from './components/Header';
import type { CategoryId } from './domain/types';

const CATS: CategoryId[] = ['cash', 'investment', 'crypto', 'assets'];

export default function App() {
  const { ready, user } = useStore();
  const [page, arg] = useRoute();
  const publicPage = !page || page === 'welcome' || page === 'login' || page === 'register';

  useEffect(() => {
    if (!ready) return;
    if (!user && !publicPage) go('welcome');
    if (user && publicPage) go('dashboard');
  }, [ready, user, publicPage]);

  if (!ready) return <div className="splash"><img src="./cardinal.png" alt="" width={64} /></div>;

  if (!user) {
    if (page === 'login') return <SignIn />;
    if (page === 'register') return <Register />;
    return <Welcome />;
  }

  return (
    <div className="app">
      <Header />
      <main>
        {page === 'holding' && arg ? <HoldingDetail id={arg} /> : <Dashboard tab={CATS.includes(arg as CategoryId) ? (arg as CategoryId) : 'cash'} />}
      </main>
    </div>
  );
}
