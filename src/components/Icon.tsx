const P: Record<string, string> = {
  bank: 'M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3l9 5H3l9-5z',
  piggy: 'M19 10c0-3.3-3.1-6-7-6S5 6.7 5 10c0 1.7.8 3.2 2 4.3V18h3v-2h4v2h3v-3.7c.8-.7 1.4-1.6 1.7-2.6H21v-2h-2zM9 9h.01',
  shield: 'M12 3l8 3v6c0 4.4-3.4 8.3-8 9-4.6-.7-8-4.6-8-9V6l8-3z',
  ticket: 'M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4V7z',
  wallet: 'M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H3V7zm0 0V5h13M17 13h.01',
  chart: 'M4 19h16M6 15l4-4 3 3 5-6',
  briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  umbrella: 'M12 3a9 9 0 019 9H3a9 9 0 019-9zm0 9v6a2 2 0 01-4 0',
  coin: 'M12 21a9 9 0 100-18 9 9 0 000 18zm-2-13h3a2 2 0 010 4h-3m0 0h3.5a2 2 0 010 4H10V8m1-2v2m0 8v2',
  watch: 'M9 3h6l1 4H8l1-4zm0 18h6l1-4H8l1 4zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2v3l2 1',
  car: 'M5 16h14M5 16v2m14-2v2M4 16l1.5-5A2 2 0 017.4 9.5h9.2a2 2 0 011.9 1.5L20 16H4zm3-2h.01M17 14h.01',
  house: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6',
  chalet: 'M2 13L12 4l10 9M5 11v9h14v-9M9 20v-5h6v5',
  castle: 'M4 21V8h2V5h2v3h2V5h4v3h2V5h2v3h2v13H4zm6 0v-5a2 2 0 014 0v5',
  boat: 'M3 16l2 4h14l2-4H3zm9-13v13M12 3l6 10h-6',
  gold: 'M4 18l2-6h5l2 6H4zm7 0l2-6h5l2 6h-9zm-3-6l2-6h4l2 6',
  art: 'M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 005-5c0-4.4-4-8-9-8zM7.5 12h.01M10 8h.01M15 8h.01',
  gem: 'M6 3h12l3 6-9 12L3 9l3-6zM3 9h18M12 21L8 9l4-6 4 6-4 12',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm0 0l9 4 9-4M12 11v10',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 18l-6-6 6-6',
  chevron: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zm9 3l-5-5',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  up: 'M7 14l5-5 5 5',
  down: 'M7 10l5 5 5-5',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 00-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 002 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  arrow: 'M4 12h16m-6-6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z',
  download: 'M12 4v11m-5-5l5 5 5-5M5 20h14',
  mail: 'M3 6h18v12H3zm0 0l9 7 9-7',
  bell: 'M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zm4 4h4',
  moon: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z',
  plusCircle: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v8M8 12h8',
  minusCircle: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12h8',
};

export function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.box} />
    </svg>
  );
}
