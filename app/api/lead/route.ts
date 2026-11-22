import { NextResponse } from 'next/server';
import { leadSchema, createLead } from '@/lib/leads';
import { getUser } from '@/lib/session';

// Простая защита от спама: не больше 5 заявок с одного IP за 10 минут.
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return NextResponse.json({ error: 'Слишком много заявок, попробуйте позже' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Проверьте поля' }, { status: 400 });
  const user = await getUser();
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const r = await createLead(parsed.data, user?.uid ?? null, site);
  return NextResponse.json({ ok: true, id: r.id });
}
