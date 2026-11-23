import { siteDomains } from '@/lib/site';

// Caddy спрашивает перед выпуском HTTPS-сертификата: разрешён ли этот домен (защита от чужих доменов).
export async function GET(req: Request) {
  const domain = (new URL(req.url).searchParams.get('domain') ?? '').toLowerCase();
  const allowed = await siteDomains();
  const ok = allowed.some((d) => domain === d || domain === `www.${d}`);
  return new Response(ok ? 'ok' : 'no', { status: ok ? 200 : 403 });
}
