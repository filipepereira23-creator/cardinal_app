export function MainTabs({ active }: { active: 'wealth' | 'path' }) {
  return (
    <nav className="main-tabs" aria-label="Sections">
      <a href="#/dashboard" className={active === 'wealth' ? 'on' : ''} aria-current={active === 'wealth'}>Total wealth</a>
      <a href="#/path" className={active === 'path' ? 'on' : ''} aria-current={active === 'path'}>Net worth path</a>
    </nav>
  );
}
