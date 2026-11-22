// Перевод корейских названий Encar на латиницу/русский.
// Сначала словарь, затем романизация оставшегося хангыля (без хангыля на сайте).

export const MANUFACTURERS: Record<string, string> = {
  '현대': 'Hyundai', '제네시스': 'Genesis', '기아': 'Kia', '쉐보레(GM대우)': 'Chevrolet',
  '르노코리아(삼성)': 'Renault Korea', 'KG모빌리티(쌍용)': 'KGM (SsangYong)', '기타 제조사': 'Другие',
  BMW: 'BMW', BYD: 'BYD', GMC: 'GMC', '닛산': 'Nissan', '다이하쯔': 'Daihatsu', '닷지': 'Dodge',
  '도요타': 'Toyota', '동풍소콘': 'DFSK', '람보르기니': 'Lamborghini', '랜드로버': 'Land Rover',
  '렉서스': 'Lexus', 'MG로버': 'MG Rover', '로터스': 'Lotus', '롤스로이스': 'Rolls-Royce', '르노': 'Renault',
  '링컨': 'Lincoln', '마세라티': 'Maserati', '마이바흐': 'Maybach', '마쯔다': 'Mazda', '맥라렌': 'McLaren',
  '머큐리': 'Mercury', '미니': 'MINI', '미쯔비시': 'Mitsubishi', '미쯔오까': 'Mitsuoka', '벤츠': 'Mercedes-Benz',
  '벤틀리': 'Bentley', '볼보': 'Volvo', '부가티': 'Bugatti', '북기은상': 'BAIC', '뷰익': 'Buick', '사브': 'Saab',
  '사이언': 'Scion', '신위안': 'Xinyuan', '새턴': 'Saturn', '쉐보레': 'Chevrolet', '스마트': 'Smart',
  '스바루': 'Subaru', '스즈키': 'Suzuki', '시트로엥/DS': 'Citroen / DS', '아우디': 'Audi', '알파 로메오': 'Alfa Romeo',
  '애스턴마틴': 'Aston Martin', '어큐라': 'Acura', '오펠': 'Opel', '올즈모빌': 'Oldsmobile', '이네오스': 'Ineos',
  '이스즈': 'Isuzu', '인피니티': 'Infiniti', '재규어': 'Jaguar', '지리': 'Geely', '지프': 'Jeep', '지커': 'Zeekr',
  '조이롱': 'Joylong', '캐딜락': 'Cadillac', '코닉세그': 'Koenigsegg', '크라이슬러': 'Chrysler', '테슬라': 'Tesla',
  '파가니': 'Pagani', '페라리': 'Ferrari', '포드': 'Ford', '포르쉐': 'Porsche', '포톤': 'Foton', '폭스바겐': 'Volkswagen',
  '폰티악': 'Pontiac', '폴스타': 'Polestar', '푸조': 'Peugeot', '피아트': 'Fiat', '험머': 'Hummer', '혼다': 'Honda',
  '기타 수입차': 'Другие',
};

export type Fuel = 'petrol' | 'diesel' | 'lpg' | 'hybrid' | 'diesel_hybrid' | 'electric' | 'hydrogen' | 'other';

export const FUEL_FROM_KO: Record<string, Fuel> = {
  '가솔린': 'petrol', '디젤': 'diesel', 'LPG(일반인 구입)': 'lpg', 'LPG': 'lpg', '가솔린+전기': 'hybrid',
  '디젤+전기': 'diesel_hybrid', 'LPG+전기': 'hybrid', '가솔린+LPG': 'petrol', '가솔린+CNG': 'petrol',
  '전기': 'electric', '수소': 'hydrogen', 'CNG': 'other', '기타': 'other',
};

export const FUEL_LABEL: Record<Fuel, string> = {
  petrol: 'бензин', diesel: 'дизель', lpg: 'газ (LPG)', hybrid: 'гибрид', diesel_hybrid: 'дизель-гибрид',
  electric: 'электро', hydrogen: 'водород', other: 'другое',
};

export const COLORS: Record<string, string> = {
  '흰색': 'белый', '검정색': 'чёрный', '쥐색': 'тёмно-серый', '청색': 'синий', '은색': 'серебристый',
  '은회색': 'серебристо-серый', '진주색': 'перламутровый', '빨간색': 'красный', '하늘색': 'голубой', '녹색': 'зелёный',
  '갈색': 'коричневый', '노란색': 'жёлтый', '담녹색': 'тёмно-зелёный', '연금색': 'светло-золотистый', '명은색': 'светло-серебристый',
  '연두색': 'салатовый', '은하색': 'серебристо-голубой', '주황색': 'оранжевый', '갈대색': 'бежевый', '청옥색': 'бирюзовый',
  '자주색': 'бордовый', '보라색': 'фиолетовый', '검정투톤': 'чёрный (двухцветный)', '흰색투톤': 'белый (двухцветный)',
  '분홍색': 'розовый', '금색': 'золотистый', '은색투톤': 'серебристый (двухцветный)', '진주투톤': 'перламутровый (двухцветный)',
  '갈색투톤': 'коричневый (двухцветный)', '금색투톤': 'золотистый (двухцветный)', '기타 색상': 'другой',
};

export const BODIES: Record<string, string> = {
  '경차': 'Малолитражка', '소형차': 'Малый класс', '준중형차': 'Компакт', '중형차': 'Средний класс', '대형차': 'Бизнес-класс',
  '스포츠카': 'Спорткар', SUV: 'SUV', RV: 'Минивэн', '경승합차': 'Микроавтобус', '승합차': 'Микроавтобус', '화물차': 'Грузовой',
  '세단': 'Седан', '해치백': 'Хэтчбек', '쿠페': 'Купе', '컨버터블': 'Кабриолет', '왜건': 'Универсал', '픽업트럭': 'Пикап', '밴': 'Фургон',
};

export const TRANSMISSIONS: Record<string, string> = {
  '오토': 'автомат', '수동': 'механика', '세미오토': 'робот', CVT: 'вариатор', '기타': 'другая',
};

// Слова в названиях моделей и комплектаций. Порядок важен: длинные фразы раньше коротких.
const PHRASES: [string, string][] = [
  ['디 올 뉴', 'The All New'], ['디올뉴', 'The All New'], ['올 뉴', 'All New'], ['올뉴', 'All New'],
  ['더 뉴', 'The New'], ['더뉴', 'The New'], ['뉴 라이즈', 'New Rise'], ['베리 뉴', 'Very New'], ['신형', 'New'],
  ['플러그인 하이브리드', 'Plug-in Hybrid'], ['하이브리드', 'Hybrid'], ['일렉트릭', 'Electric'], ['전기', 'EV'],
  ['가솔린', 'Бензин'], ['디젤', 'Дизель'], ['터보', 'Turbo'], ['수소', 'Hydrogen'],
  ['4륜', '4WD'], ['2륜', '2WD'], ['사륜', '4WD'], ['이륜', '2WD'],
  ['익스클루시브', 'Exclusive'], ['프레스티지', 'Prestige'], ['노블레스', 'Noblesse'], ['시그니처', 'Signature'],
  ['캘리그래피', 'Calligraphy'], ['인스퍼레이션', 'Inspiration'], ['프리미엄', 'Premium'], ['럭셔리', 'Luxury'],
  ['트렌디', 'Trendy'], ['스마트', 'Smart'], ['모던', 'Modern'], ['스타일', 'Style'], ['디럭스', 'Deluxe'],
  ['스페셜', 'Special'], ['리미티드', 'Limited'], ['플래티넘', 'Platinum'], ['아너스', 'Honors'], ['그래비티', 'Gravity'],
  ['베스트 셀렉션', 'Best Selection'], ['베스트셀렉션', 'Best Selection'], ['밸류', 'Value'], ['어반', 'Urban'],
  ['에디션', 'Edition'], ['블랙', 'Black'], ['화이트', 'White'], ['스포츠', 'Sport'], ['기본형', 'Base'], ['고급형', 'High'],
  ['최고급형', 'Top'], ['일반형', 'Standard'], ['패밀리', 'Family'], ['비즈니스', 'Business'], ['캠핑', 'Camping'],
  ['카고', 'Cargo'], ['밴', 'Van'], ['쿠페', 'Coupe'], ['컨버터블', 'Convertible'], ['카브리올레', 'Cabriolet'],
  ['리무진', 'Limousine'], ['롱바디', 'Long'], ['롱레인지', 'Long Range'], ['스탠다드', 'Standard'], ['퍼포먼스', 'Performance'],
  ['인승', '-местный'], ['도어', '-дверный'], ['세대', ' поколение'],
  // приставки поколений
  ['기아', 'Kia'], ['현대', 'Hyundai'], ['리얼 뉴', 'Real New'], ['어메이징 뉴', 'Amazing New'], ['디 엣지', 'The Edge'], ['뉴', 'New'], ['더', 'The'], ['올', 'All'], ['디', 'The'],
  // модели (Encar местами пишет латиницей с ошибками, поэтому задаём явно)
  ['그랜드 스타렉스', 'Grand Starex'], ['그랜드스타렉스', 'Grand Starex'], ['스타렉스', 'Starex'], ['스타리아', 'Staria'],
  ['그랜저', 'Grandeur'], ['쏘나타', 'Sonata'], ['아반떼', 'Avante'], ['카니발', 'Carnival'], ['쏘렌토', 'Sorento'], ['싼타페', 'Santa Fe'],
  ['모닝', 'Morning'], ['레이', 'Ray'], ['코나', 'Kona'], ['스포티지', 'Sportage'], ['팰리세이드', 'Palisade'], ['셀토스', 'Seltos'],
  ['투싼', 'Tucson'], ['스파크', 'Spark'], ['아이오닉', 'Ioniq'], ['코란도', 'Korando'], ['렉스턴', 'Rexton'], ['티볼리', 'Tivoli'],
  ['트레일블레이저', 'Trailblazer'], ['니로', 'Niro'], ['모하비', 'Mohave'], ['넥쏘', 'Nexo'], ['스팅어', 'Stinger'], ['캐스퍼', 'Casper'],
  ['토레스', 'Torres'], ['무쏘', 'Musso'], ['베뉴', 'Venue'], ['맥스크루즈', 'Maxcruz'], ['트랙스', 'Trax'], ['임팔라', 'Impala'],
  ['말리부', 'Malibu'], ['크루즈', 'Cruze'], ['콜로라도', 'Colorado'], ['트래버스', 'Traverse'], ['볼트', 'Bolt'], ['오피러스', 'Opirus'],
  ['에쿠스', 'Equus'], ['제네시스', 'Genesis'], ['벨로스터', 'Veloster'], ['i30', 'i30'], ['엑센트', 'Accent'], ['쏘울', 'Soul'],
  ['스토닉', 'Stonic'], ['봉고', 'Bongo'], ['포터', 'Porter'], ['카렌스', 'Carens'], ['프라이드', 'Pride'], ['로체', 'Lotze'],
  ['아르카나', 'Arkana'], ['마스터', 'Master'], ['체어맨', 'Chairman'], ['액티언', 'Actyon'], ['카이런', 'Kyron'],
  ['시리즈', ' Series'], ['클래스', 'Class'], ['쿠퍼', 'Cooper'], ['컨트리맨', 'Countryman'], ['클럽맨', 'Clubman'], ['콰트로', 'quattro'],
  ['카이엔', 'Cayenne'], ['마칸', 'Macan'], ['타이칸', 'Taycan'], ['파나메라', 'Panamera'], ['디스커버리', 'Discovery'], ['레인지로버', 'Range Rover'],
  ['랭글러', 'Wrangler'], ['체로키', 'Cherokee'], ['익스플로러', 'Explorer'], ['브롱코', 'Bronco'], ['머스탱', 'Mustang'], ['티구안', 'Tiguan'],
  ['제타', 'Jetta'], ['파사트', 'Passat'], ['골프', 'Golf'], ['아테온', 'Arteon'], ['아르테온', 'Arteon'], ['에비에이터', 'Aviator'], ['파일럿', 'Pilot'],
  ['어코드', 'Accord'], ['캠리', 'Camry'], ['프리우스', 'Prius'], ['라브4', 'RAV4'], ['시에나', 'Sienna'],
  // комплектации и прочее
  ['세부등급 없음', ''], ['세부등급', ''], ['없음', ''], ['플러스', 'Plus'], ['프리미어', 'Premier'], ['에어', 'Air'], ['그랜드', 'Grand'],
  ['엣지', 'Edge'], ['클래식', 'Classic'], ['프로', 'Pro'], ['프라임', 'Prime'], ['롱', 'Long'], ['레인지', 'Range'], ['아방가르드', 'Avantgarde'],
  ['인스크립션', 'Inscription'], ['르블랑', 'Le Blanc'], ['프레지던트', 'President'], ['일렉트리파이드', 'Electrified'], ['뷰티풀', 'Beautiful'],
  ['어린이보호차', 'School bus'], ['칸', 'Khan'], ['싱글모터', 'Single Motor'], ['듀얼모터', 'Dual Motor'], ['렌터카용', 'ex-rental'], ['렌터카', 'ex-rental'],
  ['그란쿠페', 'Gran Coupe'], ['세단', 'Sedan'], ['크로스컨트리', 'Cross Country'], ['어스', 'Earth'], ['탑', 'Top'], ['페이버드', 'Favored'],
  ['아머', 'Armor'], ['초이스', 'Choice'], ['로열', 'Royal'], ['넥스트', 'Next'], ['성능형', 'Performance'], ['테크노', 'Techno'], ['테크', 'Tech'],
  ['에어로다이나믹', 'Aerodynamic'], ['오버랜드', 'Overland'], ['파워', 'Power'], ['주년', 'th Anniversary'], ['다이내믹', 'Dynamic'],
  ['리얼', 'Real'], ['투리스모', 'Turismo'], ['트론', 'tron'], ['크로스오버', 'Crossover'], ['볼드', 'Bold'], ['올스페이스', 'Allspace'],
  ['기어', 'Gear'], ['엘리트', 'Elite'], ['마이스터', 'Meister'], ['익스트림', 'Xtreme'], ['모델', 'Model'], ['노블', 'Noble'], ['르', 'Le'], ['컬렉션', 'Collection'], ['샤인', 'Shine'], ['스페이스투어러', 'SpaceTourer'],
  ['렌트카용', 'ex-rental'], ['렌트카', 'ex-rental'], ['플럭스', 'Flux'], ['베이스', 'Base'], ['투어러', 'Tourer'], ['디자인', 'Design'],
  ['퓨어', 'Pure'], ['엑셀런스', 'Excellence'], ['컴페티션', 'Competition'], ['바이퓨얼', 'Bi-Fuel'], ['왜건', 'Wagon'],
  ['임프레션', 'Impression'], ['세이프티팩', 'Safety Pack'], ['리저브', 'Reserve'], ['마스터즈', 'Masters'], ['플러그인', 'Plug-in'],
  ['알뤼르', 'Allure'], ['인텐스', 'Intense'], ['액티브', 'Active'], ['럭스', 'Lux'], ['프로페셔널', 'Professional'], ['스타일리시', 'Stylish'],
  ['베스트', 'Best'], ['셀렉션', 'Selection'], ['에센셜', 'Essential'], ['익스피리언스', 'Experience'], ['아방가르드', 'Avantgarde'],
  ['어드밴스드', 'Advanced'], ['얼티밋', 'Ultimate'], ['프레스티지', 'Prestige'], ['쿠페', 'Coupe'], ['그란', 'Gran'], ['투어링', 'Touring'],
  ['오토', 'Auto'], ['플래티넘', 'Platinum'], ['트림', 'Trim'], ['하이', 'High'], ['로우', 'Low'], ['쿨', 'Cool'], ['밴', 'Van'],
  ['럭셔리', 'Luxury'], ['밸류플러스', 'Value Plus'], ['하이패스', 'Hi-pass'], ['블루', 'Blue'], ['레드', 'Red'], ['그레이', 'Gray'],
];

// Хангыль → латиница (упрощённая официальная романизация).
const INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const MEDIALS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const FINALS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

export function romanize(text: string): string {
  let out = '';
  let wordStart = true;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      const syl = INITIALS[Math.floor(idx / 588)]! + MEDIALS[Math.floor((idx % 588) / 28)]! + FINALS[idx % 28]!;
      out += wordStart ? syl.charAt(0).toUpperCase() + syl.slice(1) : syl;
      wordStart = false;
    } else {
      out += ch;
      wordStart = /[\s(\-/]/.test(ch);
    }
  }
  return out;
}

const HANGUL = /[가-힣]/;
const HANGUL_ONLY = /^[가-힣]+$/;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Короткие слова (1–2 слога) заменяем только целиком, иначе «르» испортит «아르테온».
const SUFFIXES = new Set(['세대', '인승', '도어', '주년']);
const PHRASE_RULES: [RegExp | string, string][] = PHRASES.map(([k, v]) =>
  HANGUL_ONLY.test(k) && k.length <= 2 && !SUFFIXES.has(k) ? [new RegExp(`(^|[\\s(/])${escapeRe(k)}(?=$|[\\s)/])`, 'g'), `$1${v}`] : [k, v],
);

export function translateName(ko: string | null | undefined, extra: Record<string, string> = {}): string {
  if (!ko) return '';
  // «뉴SM5», «더뉴K5» — слитное написание перед латиницей
  let s = ko.replace(/(^|[\s(])(?:더\s?)?뉴(?=[A-Za-z0-9])/g, (m, pre: string) => `${pre}${m.includes('더') ? 'The New ' : 'New '}`);
  for (const [k, v] of PHRASE_RULES) s = typeof k === 'string' ? s.split(k).join(v) : s.replace(k, v);
  // затем названия моделей из справочника Encar (например, 그랜저 → Grandeur)
  const entries = Object.entries(extra).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of entries) {
    if (!k || !HANGUL.test(k)) continue;
    s = HANGUL_ONLY.test(k) && k.length <= 2
      ? s.replace(new RegExp(`(^|[\\s(/])${escapeRe(k)}(?=$|[\\s)/])`, 'g'), `$1${v}`)
      : s.split(k).join(v);
  }
  s = s.replace(/(\d+)\s*поколение/g, '$1-е поколение');
  if (HANGUL.test(s)) s = romanize(s);
  return s.replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').replace(/\s+-/g, '-').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

export function translateFuel(ko: string | null | undefined): Fuel {
  if (!ko) return 'other';
  return FUEL_FROM_KO[ko] ?? (ko.includes('전기') ? 'hybrid' : 'other');
}

export function translateManufacturer(ko: string): string {
  return MANUFACTURERS[ko] ?? translateName(ko);
}

// Полный привод по названию комплектации (Encar не отдаёт тип привода отдельным полем).
export function detectAwd(...names: (string | null | undefined)[]): boolean {
  const s = names.filter(Boolean).join(' ');
  return /(AWD|4WD|4MATIC|xDrive|quattro|4Motion|HTRAC|4륜|사륜|ALL4|Q4|4X4|E-4WD|AWC)/i.test(s);
}

// Опечатки и написания в английских названиях Encar.
const EN_FIX: Record<string, string> = { Canival: 'Carnival', Santafe: 'Santa Fe', 'Santa fe': 'Santa Fe', Grandstarex: 'Grand Starex', RAY: 'Ray' };

export function fixEnglish(s: string): string {
  const t = s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().replace(/(^|\s)([a-z])(?=[a-z]+(\s|$))/g, (_m, p: string, c: string) => p + c.toUpperCase());
  return EN_FIX[t] ?? t;
}
