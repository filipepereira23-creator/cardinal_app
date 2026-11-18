export function MainTabs({ active }: { active: 'wealth' | 'path' | 'connections' }) {
  return (
    <nav className="main-tabs" aria-label="Sections">
      <a href="#/dashboard" className={active === 'wealth' ? 'on' : ''} aria-current={active === 'wealth'}>Total Wealth</a>
      <a href="#/path" className={active === 'path' ? 'on' : ''} aria-current={active === 'path'}>Net Worth Path</a>
      <a href="#/connections" className={active === 'connections' ? 'on' : ''} aria-current={active === 'connections'}>Connections</a>
    </nav>
  );
}
