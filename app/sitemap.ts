import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await siteUrl();
  const pages = ['', '/catalog', '/steps', '/guarantees', '/about', '/contacts'].map((p) => ({ url: `${site}${p}`, changeFrequency: 'daily' as const }));
  const brands = await query<{ manufacturer: string; model_group: string | null }>(
    `select distinct manufacturer, model_group from cars where active and price_rub is not null`,
  );
  const cars = await query<{ id: number; modified_at: Date | null }>(
    'select id, modified_at from cars where active and price_rub is not null order by modified_at desc nulls last limit 40000',
  );
  return [
    ...pages,
    ...brands.map((b) => ({
      url: `${site}/catalog?brand=${encodeURIComponent(b.manufacturer)}${b.model_group ? `&model=${encodeURIComponent(b.model_group)}` : ''}`,
      changeFrequency: 'daily' as const,
    })),
    ...cars.map((c) => ({ url: `${site}/car/${c.id}`, lastModified: c.modified_at ?? undefined })),
  ];
}
