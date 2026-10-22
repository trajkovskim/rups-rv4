export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.2" />
      <ellipse cx="16" cy="16" rx="6" ry="13" stroke="var(--mesto)" strokeWidth="2.2" />
      <path d="M3.5 16h25" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <LogoMark size={size} />
      <span className="text-[16px] font-bold tracking-[-0.02em]">Meridiani</span>
    </span>
  );
}
