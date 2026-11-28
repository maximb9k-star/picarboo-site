// Мягкие гибриды (48 В): Encar пишет у них «бензин» или «дизель», Naver тоже часто не помечает MHEV.
// Распознаём по марке, поколению и модельному году. motorHp — пиковая мощность стартер-генератора, л.с.;
// для таможни берётся 30-минутная (45% пиковой) и прибавляется к мощности ДВС.
// Список можно дополнять: модель (как в Encar, по-корейски), минимальный модельный год, условие по объёму/версии.

export interface MhevInput {
  makerKo: string | null;
  modelKo: string;
  formYear: number | null;
  cc: number | null;
  variant: string | null; // версия из комплектации Encar: 520i, 450, 40i…
  fuel: string;           // petrol | diesel (у гибридов и электро правила не применяются)
}

interface Rule {
  maker: string;
  model: RegExp;
  minYear?: number;
  minCc?: number;
  variant?: RegExp;       // если задано — только эти версии
  motorHp: number;
  note: string;
}

const RULES: Rule[] = [
  // BMW
  { maker: 'BMW', model: /^5시리즈 \(G60\)/, motorHp: 11, note: 'BMW 5 G60 — 48 В' },
  { maker: 'BMW', model: /^7시리즈 \(G70\)/, motorHp: 18, note: 'BMW 7 G70 — 48 В' },
  { maker: 'BMW', model: /^X3 \(G45\)/, motorHp: 11, note: 'BMW X3 G45 — 48 В' },
  { maker: 'BMW', model: /^X[56]M? \(G0[56]\)/, minYear: 2024, motorHp: 12, note: 'BMW X5/X6 рестайлинг (LCI) — 48 В' },
  { maker: 'BMW', model: /^X7 \(G07\)/, minYear: 2023, motorHp: 12, note: 'BMW X7 рестайлинг (LCI) — 48 В' },
  // Mercedes-Benz
  { maker: '벤츠', model: /^(C-클래스 W206|CLE-클래스 C236|GLC-클래스 X254|E-클래스 W214)/, motorHp: 23, note: 'Mercedes EQ Boost — 48 В' },
  { maker: '벤츠', model: /^(S-클래스 W223|G-클래스 W465)/, motorHp: 20, note: 'Mercedes EQ Boost — 48 В' },
  { maker: '벤츠', model: /^(GLE-클래스 W167|GLS-클래스 X167)/, minYear: 2024, motorHp: 22, note: 'Mercedes GLE/GLS рестайлинг — 48 В' },
  { maker: '벤츠', model: /^(GLE-클래스 W167|GLS-클래스 X167|E-클래스 W213|CLS-클래스 C257)/, variant: /(?<!\d)(450|580|53|63)(?!\d)/, motorHp: 22, note: 'Mercedes EQ Boost (450/53/580) — 48 В' },
  // Volvo: с 2021 модельного года бензиновые и дизельные B4/B5/B6 — мягкие гибриды
  { maker: '볼보', model: /^(XC40|XC60|XC90|S60|S90|V60|V90)/, minYear: 2021, motorHp: 14, note: 'Volvo B4/B5/B6 — 48 В' },
  // Land Rover: рядные 3.0 Ingenium и V8 — мягкие гибриды
  { maker: '랜드로버', model: /^(레인지로버 5세대|레인지로버 스포츠 3세대|디펜더|디스커버리 5)/, minYear: 2021, minCc: 2900, motorHp: 20, note: 'Land Rover MHEV — 48 В' },
  // Audi: V6/V8 3.0–4.0 TFSI/TDI с 48 В
  { maker: '아우디', model: /^(A6 \(C8\)|A6 \(C9\)|A7 \(4K\)|A8 \(D5\)|Q7 \(4M\)|Q8 \(4M\)|SQ7|SQ8|RS6|RS7|RSQ8|S6|S7|S8)/, minCc: 2900, motorHp: 16, note: 'Audi MHEV — 48 В' },
  // Genesis 3.5T e-S/C (рестайлинг GV80 и GV80 Coupe)
  { maker: '제네시스', model: /^GV80/, minYear: 2024, minCc: 3400, motorHp: 20, note: 'Genesis 3.5T e-S/C — 48 В' },
];

export function mildHybridRule(c: MhevInput): { motorHp: number; note: string } | null {
  if (c.fuel !== 'petrol' && c.fuel !== 'diesel') return null;
  for (const r of RULES) {
    if (r.maker !== c.makerKo || !r.model.test(c.modelKo)) continue;
    if (r.minYear && (c.formYear ?? 0) < r.minYear) continue;
    if (r.minCc && (c.cc ?? 0) < r.minCc) continue;
    if (r.variant && !r.variant.test(c.variant ?? '')) continue;
    return { motorHp: r.motorHp, note: r.note };
  }
  return null;
}
