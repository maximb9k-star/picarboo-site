// Данные для страницы авто «вживую»: детали с Encar (кэш 1 час) и расчёт цены по текущим курсам.
import { fetchVehicle, fetchRecord, fetchInspection, NotFoundError } from './encar/client';
import { mapDetail, type CarDetailRow } from './encar/map';
import { loadRates } from './rates';
import { loadSettings } from './settings';
import { calcPrice, type PriceBreakdown } from './pricing/price';
import type { CarFull } from './catalog';
import { memo } from './memo';

export async function liveDetail(id: number): Promise<{ detail: CarDetailRow | null; gone: boolean }> {
  try {
    const v = await fetchVehicle(id, 3600);
    const [rec, ins] = await Promise.all([
      v.vehicleNo ? fetchRecord(v.vehicleId, v.vehicleNo, 3600) : Promise.resolve(null),
      fetchInspection(v.vehicleId, 3600),
    ]);
    return { detail: mapDetail(v, rec, ins), gone: false };
  } catch (e) {
    return { detail: null, gone: e instanceof NotFoundError };
  }
}

export async function livePrice(car: CarFull): Promise<PriceBreakdown | null> {
  try {
    const [rates, settings] = await Promise.all([memo('rates', loadRates), memo('settings', loadSettings)]);
    return calcPrice({ priceKrw: car.price_krw, yearMonth: car.year_month, displacementCc: car.displacement, hp: car.hp, fuel: car.fuel }, rates, settings);
  } catch {
    return null;
  }
}
