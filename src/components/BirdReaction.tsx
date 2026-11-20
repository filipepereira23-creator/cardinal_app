/** A cardinal face, happy or sad, drawn inline so it works offline. */
export function BirdFace({ mood, size = 26 }: { mood: 'happy' | 'sad'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M13 6c1-4 4-5 6-4-1 1-1.500 2.200-1.500 3.600 1-.9 2.600-1.200 3.800-.8-1.500.7-2.300 1.800-2.500 3z" fill="#DB0011" />
      <circle cx="16" cy="18" r="11" fill="#DB0011" />
      <path d="M7 16c1.500-4 5-6 9-6s7.500 2 9 6c-3-1.200-6-1.800-9-1.800S10 14.800 7 16z" fill="#B2000E" />
      <ellipse cx="16" cy="17.500" rx="6" ry="4.800" fill="#1b1b1b" opacity=".92" />
      <circle cx="12.800" cy="14.400" r="2.200" fill="#fff" />
      <circle cx="19.200" cy="14.400" r="2.200" fill="#fff" />
      <circle cx="12.800" cy={mood === 'sad' ? 15 : 14.600} r="1" fill="#111" />
      <circle cx="19.200" cy={mood === 'sad' ? 15 : 14.600} r="1" fill="#111" />
      {mood === 'sad' && <path d="M10.800 12l3-1.200M21.200 12l-3-1.200" stroke="#111" strokeWidth="1" strokeLinecap="round" />}
      <path d="M13.500 18.500h5l-2.500 3.600z" fill="#F5A300" />
      {mood === 'happy'
        ? <path d="M12.500 24c1 1.600 2.200 2.300 3.500 2.300s2.500-.7 3.500-2.300" fill="none" stroke="#fff" strokeWidth="1.300" strokeLinecap="round" />
        : <path d="M12.500 26c1-1.500 2.200-2.200 3.500-2.200s2.500.7 3.500 2.200" fill="none" stroke="#fff" strokeWidth="1.300" strokeLinecap="round" />}
      {mood === 'sad' && <path d="M12.800 17.200c-.5 1.200-.5 2.200 0 3" fill="none" stroke="#6ec3ff" strokeWidth="1.200" strokeLinecap="round" />}
    </svg>
  );
}
