import { NextResponse } from 'next/server';
import { COOKIE_NAMES } from '@/lib/session';

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/', req.url), 303);
  res.cookies.delete(COOKIE_NAMES.user);
  return res;
}
