import { NextResponse } from 'next/server';
import { leadSchema, createLead } from '@/lib/leads';
import { getUser } from '@/lib/session';
import { siteUrl } from '@/lib/site';
import { rateLimit, ipFrom } from '@/lib/ratelimit';

// Защита от спама: не больше 5 заявок с одного IP за 10 минут и 60 со всех IP за 10 минут.
export async function POST(req: Request) {
  const ip = ipFrom(req.headers);
  if (!rateLimit(`lead:${ip}`, 5, 10 * 60_000) || !rateLimit('lead:all', 60, 10 * 60_000)) {
    return NextResponse.json({ error: 'Слишком много заявок, попробуйте позже' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Проверьте поля' }, { status: 400 });
  const user = await getUser();
  const site = await siteUrl();
  const r = await createLead(parsed.data, user?.uid ?? null, site);
  return NextResponse.json({ ok: true, id: r.id });
}
