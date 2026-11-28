// Выкупленные автомобили для блока «Наши выкупленные авто».
// Фото кладём в public/sold/ (номера замазаны), сюда добавляем строку: файл, модель, год, город доставки.
export interface SoldCar {
  photo: string;   // путь от public, например '/sold/gv80-2023.jpg'
  title: string;   // 'Genesis GV80 3.5T'
  year?: number;
  city?: string;   // куда доставили
}

export const SOLD_CARS: SoldCar[] = [];
