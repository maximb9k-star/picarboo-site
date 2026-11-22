import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.SITE_URL || 'https://picarboo.ru';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/favorites'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
