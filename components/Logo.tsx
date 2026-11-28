// Знак PICARBOO: наклонная «P» — скоба и ножка одним контуром, без ступеньки на стыке.
export function LogoMark({ className = 'h-7 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 66 44" className={className} aria-hidden="true">
      <path transform="translate(17 1) skewX(-20)" d="M4 0H34A13 13 0 0 1 34 26H8V42H0V18H34A5 5 0 0 0 34 8H4Z" fill="#b5e04b" />
    </svg>
  );
}

export function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-brand text-[15px] tracking-[.08em] ${dark ? 'text-white' : 'text-ink'}`}>
        PICARB<span className="text-lime">OO</span>
      </span>
    </span>
  );
}
