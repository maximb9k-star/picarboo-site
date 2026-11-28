// Мощность по базе автомобилей Naver (блок «제원» в поиске search.naver.com).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

export interface NaverGrade {
  name: string;
  cc: number;
  fuel: string;      // как у Naver: 가솔린 | 디젤 | LPG | 전기 | 수소 ...
  hp: number;        // мощность ДВС (для электро — мотора), л.с.
  motorHp?: number;  // пиковая мощность электромотора гибрида, л.с. (0 — Naver не знает)
  turbo: boolean;
  awd: boolean;
}

// Вырезает JSON-массив/объект, начиная с открывающей скобки.
export function extractBalanced(s: string, start: number): string | null {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

interface RawRange { value?: { min?: number; max?: number } }
interface RawGrade {
  name?: string;
  engine?: { engineSize?: RawRange; fuelType?: { values?: string[] }; engineHorsepower?: RawRange; superChargingType?: { values?: string[] } };
  motor?: { fuelType?: { values?: string[] }; motorHorsepower?: { hp?: RawRange } };
  chassis?: { drive?: string[] };
}

export function parseGrades(html: string): NaverGrade[] {
  const key = '"grades":[';
  const i = html.indexOf(key);
  if (i < 0) return [];
  const json = extractBalanced(html, i + key.length - 1);
  if (!json) return [];
  let raw: RawGrade[];
  try {
    raw = JSON.parse(json) as RawGrade[];
  } catch {
    return [];
  }
  const out: NaverGrade[] = [];
  for (const g of raw) {
    const cc = g.engine?.engineSize?.value?.max ?? 0;
    const engineHp = g.engine?.engineHorsepower?.value?.max ?? 0;
    const motorHp = g.motor?.motorHorsepower?.hp?.value?.max ?? 0;
    const fuel = g.engine?.fuelType?.values?.[0] ?? g.motor?.fuelType?.values?.[0] ?? '';
    const hp = engineHp > 0 ? engineHp : motorHp;
    if (hp <= 0) continue;
    const drive = (g.chassis?.drive ?? []).join(' ');
    out.push({
      name: g.name ?? '',
      cc,
      fuel: engineHp > 0 ? fuel : '전기',
      hp,
      motorHp: engineHp > 0 ? motorHp : 0,
      turbo: (g.engine?.superChargingType?.values ?? []).some((v) => v.includes('터보')),
      awd: /사륜|4륜|AWD|4WD/.test(drive) || /AWD|4WD|xDrive|4MATIC|quattro|HTRAC/i.test(g.name ?? ''),
    });
  }
  return out;
}

export interface MatchInput {
  cc: number | null;
  fuel: string;        // наш код топлива: petrol | diesel | lpg | hybrid | electric ...
  turbo: boolean | null; // по названию комплектации; null — неизвестно
  variant?: string | null; // обозначение версии из комплектации Encar: 520i, GLC300, 35 TDI…
}

export interface MatchResult {
  hp: number;
  hpMin: number;
  hpMax: number;
  status: 'ok' | 'ambiguous';
  grade: string;
  motorHp: number;   // пиковая мощность электромотора выбранной комплектации (0 — нет данных)
}

const FUEL_TO_NAVER: Record<string, string[]> = {
  petrol: ['가솔린'], hybrid: ['가솔린', '하이브리드'], diesel: ['디젤'], diesel_hybrid: ['디젤'],
  lpg: ['LPG', 'LPi'], electric: ['전기'], hydrogen: ['수소', '전기'],
};

export function matchGrade(grades: NaverGrade[], input: MatchInput): MatchResult | null {
  const fuels = FUEL_TO_NAVER[input.fuel] ?? [];
  let cand = grades.filter((g) => fuels.some((f) => g.fuel.includes(f)));
  if (input.fuel !== 'electric' && input.fuel !== 'hydrogen' && input.cc) {
    const cc = input.cc;
    cand = cand.filter((g) => Math.abs(g.cc - cc) <= 60);
  }
  // Encar всегда пишет «터보 / T-GDi / TSI…» в названии турбоверсий, поэтому без пометки
  // предпочитаем атмосферный вариант, если он есть в этом поколении.
  const wantTurbo = input.turbo === true;
  if (cand.some((g) => g.turbo === wantTurbo)) {
    cand = cand.filter((g) => g.turbo === wantTurbo);
  }
  if (input.variant) {
    const v = input.variant.toLowerCase().replace(/\s+/g, '');
    const byName = cand.filter((g) => g.name.toLowerCase().replace(/\s+/g, '').includes(v));
    if (byName.length) cand = byName;
  }
  if (!cand.length) return null;
  const hps = cand.map((g) => Math.round(g.hp));
  const hpMin = Math.min(...hps);
  const hpMax = Math.max(...hps);
  // Если варианты различаются — берём максимум: цена не окажется ниже реальной («никаких сюрпризов»).
  const best = cand.find((g) => Math.round(g.hp) === hpMax)!;
  const motorHp = Math.max(0, ...cand.map((g) => Math.round(g.motorHp ?? 0)));
  return { hp: hpMax, hpMin, hpMax, status: hpMax - hpMin > 5 ? 'ambiguous' : 'ok', grade: best.name, motorHp };
}

// Обозначение версии в комплектации Encar: «520i M 스포츠» → 520i, «GLC300 4MATIC» → GLC300, «35 TDI» → 35TDI.
export function extractVariant(badge: string | null | undefined): string | null {
  if (!badge) return null;
  const drive = badge.match(/[xs]Drive\s?(\d{2}[a-z])\b/i);
  if (drive) return drive[1]!;
  const m = badge.match(/\b([A-Z]{1,4}\d{2,3}[a-zA-Z]{0,3}|\d{2,3}[a-zA-Z]{1,3})\b/) ?? badge.match(/\b(\d{2})\s?(TDI|TFSI|TSI)\b/);
  if (!m) return null;
  return (m[2] ? `${m[1]}${m[2]}` : m[1]!).trim();
}

export async function searchNaver(q: string): Promise<string> {
  const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Naver ${res.status}`);
  return res.text();
}

// Убирает поколение/кузов/приставки из названия модели Encar для поиска на Naver.
export function cleanModelName(model: string): string {
  return model
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+\s*세대/g, ' ')
    .replace(/(디 올 뉴|올 뉴|더 뉴|뉴 라이즈|베리 뉴|디 올뉴|올뉴|더뉴)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchQueries(p: { modelGroupKo: string | null; modelKo: string; formYear: number | null; makerKo?: string | null; fuel?: string }): string[] {
  const group = p.modelGroupKo ?? '';
  const model = cleanModelName(p.modelKo);
  const y = p.formYear;
  const dehyphen = (s: string) => s.replace(/-/g, '');
  const hybrid = p.fuel === 'hybrid' && !/하이브리드/.test(p.modelKo);
  const qs = [
    y && hybrid ? `${y} ${model} 하이브리드 제원` : '',
    y ? `${y} ${model} 제원` : '',
    y ? `${y} ${group} 제원` : '',
    `${p.modelKo} 제원`,
    y && group.includes('-') ? `${y} ${dehyphen(group)} 제원` : '',
    y && p.makerKo ? `${y} ${p.makerKo} ${dehyphen(group)} 제원` : '',
    y ? `${y - 1} ${model} 제원` : '',
    `${model} 제원`,
    `${group} 제원`,
  ];
  return [...new Set(qs.filter((q) => q.replace('제원', '').trim().length > 0).map((q) => q.replace(/\s+/g, ' ').trim()))];
}

export async function resolveHp(
  p: { modelGroupKo: string | null; modelKo: string; formYear: number | null; makerKo?: string | null } & MatchInput,
  delayMs = 1500,
): Promise<(MatchResult & { query: string }) | null> {
  for (const q of searchQueries(p)) {
    const html = await searchNaver(q);
    const m = matchGrade(parseGrades(html), p);
    if (m) return { ...m, query: q };
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}
