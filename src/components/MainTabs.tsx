export function MainTabs({ active }: { active: 'wealth' | 'path' | 'connections' | 'income' }) {
  return (
    <nav className="main-tabs" aria-label="Sections">
      <a href="#/dashboard" className={active === 'wealth' ? 'on' : ''} aria-current={active === 'wealth'}>Total Wealth</a>
      <a href="#/path" className={active === 'path' ? 'on' : ''} aria-current={active === 'path'}>Net Worth Path</a>
      <a href="#/income" className={active === 'income' ? 'on' : ''} aria-current={active === 'income'}>Income</a>
      <a href="#/connections" className={active === 'connections' ? 'on' : ''} aria-current={active === 'connections'}>Friends & Family</a>
    </nav>
  );
}
