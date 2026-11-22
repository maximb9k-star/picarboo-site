// Преобразование ответов Encar в строки таблицы cars.
import type { EncarListItem, EncarVehicle, EncarRecord, EncarInspection, InspectionItem } from './client';
import { translateName, translateManufacturer, translateFuel, detectAwd, fixEnglish, COLORS, BODIES, TRANSMISSIONS, type Fuel } from './translate';

export interface CarListRow {
  id: number;
  domestic: boolean;
  manufacturer_ko: string;
  model_ko: string;
  badge_ko: string | null;
  badge_detail_ko: string | null;
  manufacturer: string;
  model: string;
  badge: string | null;
  fuel: Fuel;
  transmission: string | null;
  year_month: number;
  form_year: number | null;
  mileage: number;
  price_krw: number;
  photo_path: string | null;
  photos: string[];
  sell_type: string | null;
  city: string | null;
  awd: boolean;
  modified_at: string | null;
}

export function mapListItem(it: EncarListItem, names: Record<string, string> = {}): CarListRow | null {
  const id = Number(it.Id);
  // Price 9999 / 99999 (в 10 000 ₩) — «цена по договорённости» на Encar
  if (!Number.isFinite(id) || !it.Price || it.Price <= 0 || it.Price === 9999 || it.Price === 99999) return null;
  const badge = [it.Badge, it.BadgeDetail].filter(Boolean).join(' ');
  return {
    id,
    domestic: isDomesticMaker(it.Manufacturer),
    manufacturer_ko: it.Manufacturer,
    model_ko: it.Model,
    badge_ko: it.Badge ?? null,
    badge_detail_ko: it.BadgeDetail ?? null,
    manufacturer: translateManufacturer(it.Manufacturer),
    model: translateName(it.Model, names),
    badge: badge ? translateName(badge, names) : null,
    fuel: translateFuel(it.FuelType),
    transmission: it.Transmission ? (TRANSMISSIONS[it.Transmission] ?? translateName(it.Transmission)) : null,
    year_month: Math.round(it.Year),
    form_year: it.FormYear ? Number(it.FormYear) || null : null,
    mileage: Math.round(it.Mileage ?? 0),
    price_krw: Math.round(it.Price) * 10_000,
    photo_path: it.Photos?.[0]?.location ?? (it.Photo ? `${it.Photo}001.jpg` : null),
    photos: (it.Photos ?? []).sort((a, b) => a.ordering - b.ordering).map((p) => p.location),
    sell_type: it.SellType ?? null,
    city: it.OfficeCityState ? (CITIES[it.OfficeCityState] ?? translateName(it.OfficeCityState)) : null,
    awd: detectAwd(it.Badge, it.BadgeDetail, it.Model),
    modified_at: it.ModifiedDate ? parseEncarDate(it.ModifiedDate) : null,
  };
}

const DOMESTIC = new Set(['현대', '제네시스', '기아', '쉐보레(GM대우)', '르노코리아(삼성)', 'KG모빌리티(쌍용)', '기타 제조사']);
function isDomesticMaker(m: string): boolean {
  return DOMESTIC.has(m);
}

// "2026-11-22 09:42:47.000 +09" → ISO
export function parseEncarDate(s: string): string | null {
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.\d+)? ([+-]\d{2})/);
  if (!m) return null;
  return `${m[1]}T${m[2]}${m[3]}:00`;
}

export interface CarDetailRow {
  vehicle_id: number;
  model_group_ko: string | null;
  model_group: string | null;
  displacement: number | null;
  color: string | null;
  body: string | null;
  seats: number | null;
  vin: string | null;
  vehicle_no: string | null;
  options: string[];
  awd: boolean;
  accident_cnt: number | null;
  insurance_krw: number | null;
  owner_changes: number | null;
  damaged_parts: number | null;
  photos: string[];
  transmission: string | null;
  detail: CarDetailJson;
}

export interface DamagePart { code: string; name: string; status: string[] }

export interface CarDetailJson {
  gradeEn?: string | null;
  originPriceKrw?: number | null;
  firstRegistration?: string | null;
  record?: {
    myAccidentCnt: number; otherAccidentCnt: number; myAccidentCost: number; otherAccidentCost: number;
    ownerChangeCnt: number; totalLoss: number; flood: number; robber: number; carNoChange: number;
    business: number; government: number; rental: number;
    accidents: { type: string; date: string; insuranceBenefit: number; partCost: number; laborCost: number; paintingCost: number }[];
  } | null;
  inspection?: { accident: boolean; simpleRepair: boolean; waterlog: boolean; tuning: boolean; parts: DamagePart[] } | null;
  description?: string | null;
}

export function mapDetail(v: EncarVehicle, rec: EncarRecord | null, ins: EncarInspection | null, names: Record<string, string> = {}): CarDetailRow {
  const parts = ins?.outers ? flattenParts(ins.outers) : null;
  const options = [...(v.options?.standard ?? []), ...(v.options?.choice ?? [])];
  const record: CarDetailJson['record'] = rec
    ? {
        myAccidentCnt: rec.myAccidentCnt ?? 0,
        otherAccidentCnt: rec.otherAccidentCnt ?? 0,
        myAccidentCost: rec.myAccidentCost ?? 0,
        otherAccidentCost: rec.otherAccidentCost ?? 0,
        ownerChangeCnt: rec.ownerChangeCnt ?? 0,
        totalLoss: rec.totalLossCnt ?? 0,
        flood: (rec.floodTotalLossCnt ?? 0) + (rec.floodPartLossCnt ?? 0),
        robber: rec.robberCnt ?? 0,
        carNoChange: rec.carNoChangeCnt ?? 0,
        business: rec.business ?? 0,
        government: rec.government ?? 0,
        rental: 0,
        accidents: rec.accidents ?? [],
      }
    : null;
  return {
    vehicle_id: v.vehicleId,
    model_group_ko: v.category.modelGroupName ?? null,
    model_group: v.category.modelGroupEnglishName ? fixEnglish(prettifyEnglish(v.category.modelGroupEnglishName)) : translateName(v.category.modelGroupName, names) || null,
    displacement: v.spec.displacement && v.spec.displacement > 0 ? v.spec.displacement : null,
    color: v.spec.colorName ? (COLORS[v.spec.colorName] ?? translateName(v.spec.colorName)) : null,
    body: v.spec.bodyName ? (BODIES[v.spec.bodyName] ?? translateName(v.spec.bodyName)) : null,
    seats: v.spec.seatCount ?? null,
    vin: v.vin ?? null,
    vehicle_no: v.vehicleNo ?? null,
    options,
    awd: detectAwd(v.category.gradeName, v.category.gradeDetailName, v.category.gradeEnglishName),
    accident_cnt: rec ? (rec.myAccidentCnt ?? 0) + (rec.otherAccidentCnt ?? 0) : null,
    insurance_krw: rec ? (rec.myAccidentCost ?? 0) + (rec.otherAccidentCost ?? 0) : null,
    owner_changes: rec?.ownerChangeCnt ?? null,
    damaged_parts: parts ? parts.length : null,
    photos: [...new Set((v.photos ?? []).slice().sort((a, b) => a.code.localeCompare(b.code)).map((ph) => ph.path))],
    transmission: v.spec.transmissionName ? (TRANSMISSIONS[v.spec.transmissionName] ?? translateName(v.spec.transmissionName)) : null,
    detail: {
      gradeEn: v.category.gradeEnglishName ?? null,
      originPriceKrw: v.category.originPrice ? v.category.originPrice * 10_000 : null,
      firstRegistration: rec?.firstDate ?? ins?.master?.detail?.firstRegistrationDate ?? null,
      record,
      inspection: ins?.master
        ? {
            accident: !!ins.master.accdient,
            simpleRepair: !!ins.master.simpleRepair,
            waterlog: !!ins.master.detail?.waterlog,
            tuning: !!ins.master.detail?.tuning,
            parts: parts ?? [],
          }
        : null,
      description: null,
    },
  };
}

function flattenParts(items: InspectionItem[]): DamagePart[] {
  const out: DamagePart[] = [];
  for (const it of items) {
    const statuses = it.statusTypes?.map((s) => s.code) ?? (it.statusType ? [it.statusType.code] : []);
    if (it.type && statuses.length) out.push({ code: it.type.code, name: translatePart(it.type.title), status: statuses });
    if (it.children?.length) out.push(...flattenParts(it.children));
  }
  return out;
}

const PART_WORDS: [string, string][] = [
  ['프론트 휀더', 'Переднее крыло'], ['프론트 도어', 'Передняя дверь'], ['리어 도어', 'Задняя дверь'], ['트렁크 리드', 'Крышка багажника'],
  ['라디에이터 서포트', 'Рамка радиатора'], ['쿼터 패널', 'Заднее крыло'], ['루프 패널', 'Крыша'], ['사이드실 패널', 'Порог'],
  ['프론트 패널', 'Передняя панель'], ['크로스 멤버', 'Поперечина'], ['인사이드 패널', 'Брызговик'], ['사이드 멤버', 'Лонжерон'],
  ['휠하우스', 'Колёсная арка'], ['필러 패널', 'Стойка'], ['대쉬 패널', 'Моторный щит'], ['플로어 패널', 'Пол'], ['트렁크 플로어', 'Пол багажника'],
  ['리어 패널', 'Задняя панель'], ['패키지 트레이', 'Полка багажника'], ['후드', 'Капот'], ['리어 휀더', 'Заднее крыло'],
  ['(좌)', ' (лев.)'], ['(우)', ' (прав.)'], ['좌', 'лев.'], ['우', 'прав.'], ['앞', 'перед.'], ['뒤', 'зад.'],
];

export function translatePart(title: string): string {
  let s = title;
  for (const [k, v] of PART_WORDS) s = s.split(k).join(v);
  return translateName(s);
}

export const DAMAGE_STATUS: Record<string, string> = {
  X: 'замена', W: 'сварка / рихтовка', WC: 'сварка, резка', C: 'коррозия', A: 'царапина', U: 'неровность', T: 'повреждение',
};

function prettifyEnglish(s: string): string {
  return s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

export const CITIES: Record<string, string> = {
  '서울': 'Сеул', '경기': 'Кёнгидо', '인천': 'Инчхон', '부산': 'Пусан', '대구': 'Тэгу', '대전': 'Тэджон', '광주': 'Кванджу', '울산': 'Ульсан',
  '세종': 'Сежон', '강원': 'Канвондо', '충북': 'Чхунчхон-Пукто', '충남': 'Чхунчхон-Намдо', '전북': 'Чолла-Пукто', '전남': 'Чолла-Намдо',
  '경북': 'Кёнсан-Пукто', '경남': 'Кёнсан-Намдо', '제주': 'Чеджу', '전남광주': 'Кванджу', '대구경북': 'Тэгу', '부산경남': 'Пусан',
  '대전충남': 'Тэджон', '전북전주': 'Чонджу',
};
