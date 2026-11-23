import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { tick } from '@/lib/jobs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Вызывается по расписанию (Supabase pg_cron → pg_net) с заголовком Authorization: Bearer CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? '';
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const ok = secret.length >= 16 && got.length === secret.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const r = await tick(50_000);
  return NextResponse.json(r);
}
