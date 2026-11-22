// Клиент публичного API Encar (то же, что использует сайт encar.com).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const API = 'https://api.encar.com';

export const PHOTO_HOST = 'https://ci.encar.com';

async function getJson<T>(url: string, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Referer: 'https://www.encar.com/', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 404) throw new NotFoundError(url);
      if (!res.ok) throw new Error(`Encar ${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof NotFoundError) throw e;
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}

export class NotFoundError extends Error {}

export interface EncarListItem {
  Id: string;
  Manufacturer: string;
  Model: string;
  Badge?: string;
  BadgeDetail?: string;
  Transmission?: string;
  FuelType?: string;
  Year: number;
  FormYear?: string;
  Mileage: number;
  Price: number; // в 만원 (10 000 ₩)
  SellType?: string;
  OfficeCityState?: string;
  Photo?: string;
  Photos?: { type: string; location: string; ordering: number }[];
  ModifiedDate?: string;
  Separation?: string[];
}

export interface EncarFacet {
  Value: string;
  Count: number;
  IsSelected?: boolean;
  Metadata?: { EngName?: string[]; Code?: string[] };
  Refinements?: { Nodes: EncarNode[] };
}
export interface EncarNode { Name: string; Facets: EncarFacet[] }

interface ListResponse { Count: number; SearchResults: EncarListItem[]; iNav?: { Nodes: EncarNode[] } }

// Только легковые, без лизинга/аренды (их нельзя вывезти).
export const BASE_QUERY = '(And.Hidden.N._.CarType.A._.SellType.일반.)';

export async function fetchList(q: string, offset: number, limit = 200, sort = 'ModifiedDate'): Promise<ListResponse> {
  const url = `${API}/search/car/list/general?count=true&q=${encodeURIComponent(q)}&sr=${encodeURIComponent(`|${sort}|${offset}|${limit}`)}`;
  return getJson<ListResponse>(url);
}

export async function fetchFacets(q: string): Promise<ListResponse> {
  const url = `${API}/search/car/list/general?count=true&q=${encodeURIComponent(q)}&inav=${encodeURIComponent('|Metadata|Sort')}&sr=${encodeURIComponent('|ModifiedDate|0|1')}`;
  return getJson<ListResponse>(url);
}

export interface EncarVehicle {
  vehicleId: number;
  vehicleNo?: string;
  vin?: string;
  category: {
    manufacturerName: string; modelGroupName?: string; modelName: string; gradeName?: string; gradeDetailName?: string;
    gradeEnglishName?: string; modelGroupEnglishName?: string; manufacturerEnglishName?: string;
    yearMonth?: string; formYear?: string; domestic?: boolean; originPrice?: number;
  };
  spec: { mileage?: number; displacement?: number; transmissionName?: string; fuelName?: string; colorName?: string; customColor?: string | null; seatCount?: number; bodyName?: string };
  advertisement: { price?: number; status?: string };
  options?: { standard?: string[]; choice?: string[]; etc?: string[]; tuning?: string[] };
  photos?: { code: string; path: string; type: string }[];
  condition?: { accident?: { recordView?: boolean } };
  contents?: { text?: string };
}

export async function fetchVehicle(listingId: string | number): Promise<EncarVehicle> {
  return getJson<EncarVehicle>(`${API}/v1/readside/vehicle/${listingId}`);
}

export interface EncarRecord {
  myAccidentCnt?: number; otherAccidentCnt?: number; ownerChangeCnt?: number; myAccidentCost?: number; otherAccidentCost?: number;
  accidentCnt?: number; totalLossCnt?: number; floodTotalLossCnt?: number; floodPartLossCnt?: number | null; robberCnt?: number;
  carNoChangeCnt?: number; government?: number; business?: number; loan?: number; firstDate?: string;
  accidents?: { type: string; date: string; insuranceBenefit: number; partCost: number; laborCost: number; paintingCost: number }[];
}

export async function fetchRecord(vehicleId: number, vehicleNo: string): Promise<EncarRecord | null> {
  try {
    return await getJson<EncarRecord>(`${API}/v1/readside/record/vehicle/${vehicleId}/open?vehicleNo=${encodeURIComponent(vehicleNo)}`, 2);
  } catch {
    return null;
  }
}

export interface InspectionItem {
  type?: { code: string; title: string };
  statusType?: { code: string; title: string } | null;
  statusTypes?: { code: string; title: string }[];
  attributes?: string[];
  children?: InspectionItem[];
}
export interface EncarInspection {
  master?: { accdient?: boolean; simpleRepair?: boolean; detail?: { waterlog?: boolean; tuning?: boolean; mileage?: number; firstRegistrationDate?: string } };
  inners?: InspectionItem[];
  outers?: InspectionItem[];
}

export async function fetchInspection(vehicleId: number): Promise<EncarInspection | null> {
  try {
    return await getJson<EncarInspection>(`${API}/v1/readside/inspection/vehicle/${vehicleId}`, 2);
  } catch {
    return null;
  }
}

export interface OptionMeta { optionCd: string; optionName: string; optionTypeCd: string; subOptions?: OptionMeta[] | null }

export async function fetchOptionCatalog(): Promise<OptionMeta[]> {
  const r = await getJson<{ options: OptionMeta[] }>(`${API}/v1/readside/vehicles/car/options/standard`);
  return r.options;
}

export function photoUrl(location: string, w = 560, h = 370): string {
  return `${PHOTO_HOST}/carpicture${location}?impolicy=heightRate&rh=${h}&cw=${w}&ch=${h}&cg=Center`;
}
