// Знак PICARBOO: наклонная «P» из двух штрихов + надпись. Перерисовано в SVG по логотипу.
export function LogoMark({ className = 'h-7 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 44" className={className} aria-hidden="true">
      <path d="M17 2h37c10 0 16 5 13 13-2.6 7-10 11-20 11H27.5l3.4-6.4H46c5 0 8.6-1.8 9.6-4.8 1-3-.9-4.4-5-4.4H13.6z" fill="#b5e04b" />
      <path d="M21 22.5h9.4L19.2 42H8z" fill="#b5e04b" />
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
