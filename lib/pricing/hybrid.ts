// Мощность гибридов для утильсбора: мощность ДВС + 30-минутная мощность электромотора
// (30-минутная, если не подтверждена, = 45% пиковой — см. ev30MinHp).
import { ev30MinHp } from './customs';

export type MotorSource = 'naver' | 'table' | 'default';

const KOREAN_MAKERS = ['현대', '기아', '제네시스'];

// Пиковая мощность электромотора (л.с.) типовых гибридных систем Hyundai / Kia / Genesis.
function koreanMotorHp(cc: number, turbo: boolean): number | null {
  const near = (v: number, d = 60) => Math.abs(cc - v) <= d;
  // 1.6 различаем по точному объёму: 1598 см³ — турбо Smartstream, 1580 см³ — атмосферный Kappa.
  if (near(1600, 5)) return 60;                  // Smartstream 1.6 T-GDi HEV (Sorento, Tucson, Sportage, Santa Fe, K8…) — 44,2 кВт
  if (near(1580, 5)) return 44;                  // Kappa 1.6 GDi HEV (Ioniq, Niro, Avante, Kona) — 32 кВт
  if (!turbo && (near(2000) || near(2360))) return 51; // Nu 2.0 / Theta 2.4 HEV (Sonata, K5, Grandeur, K7) — 38 кВт
  return null;
}

// Если данных нет — берём с запасом, чтобы цена не оказалась ниже реальной; модель уходит на проверку в админку.
const DEFAULT_FULL_HYBRID_MOTOR_HP = 80;
const DEFAULT_MILD_HYBRID_MOTOR_HP = 20;

export function hybridMotorPeakHp(p: { makerKo: string | null; cc: number | null; turbo: boolean; mild: boolean; naverMotorHp: number; mildMotorHp?: number | null }): { peak: number; source: MotorSource } {
  if (p.naverMotorHp > 0) return { peak: Math.round(p.naverMotorHp), source: 'naver' };
  if (p.mild && p.mildMotorHp) return { peak: p.mildMotorHp, source: 'table' };
  if (!p.mild && p.makerKo && KOREAN_MAKERS.includes(p.makerKo) && p.cc) {
    const t = koreanMotorHp(p.cc, p.turbo);
    if (t) return { peak: t, source: 'table' };
  }
  return { peak: p.mild ? DEFAULT_MILD_HYBRID_MOTOR_HP : DEFAULT_FULL_HYBRID_MOTOR_HP, source: 'default' };
}

export function hybridCustomsHp(iceHp: number, motorPeakHp: number): number {
  return Math.round(iceHp) + ev30MinHp(motorPeakHp);
}

export function isMildHybridGrade(grade: string | null | undefined): boolean {
  return /MHEV|마일드/i.test(grade ?? '');
}
