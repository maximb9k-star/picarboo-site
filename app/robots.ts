import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/favorites'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
