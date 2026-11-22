import { NextResponse } from 'next/server';
import { facetModelGroups, facetModels } from '@/lib/catalog';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const brand = url.searchParams.get('brand')?.slice(0, 100);
  const model = url.searchParams.get('model')?.slice(0, 100);
  if (!brand) return NextResponse.json({ options: [] });
  const options = model ? await facetModels(brand, model) : await facetModelGroups(brand);
  return NextResponse.json({ options }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
