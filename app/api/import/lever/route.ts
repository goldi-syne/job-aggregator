import { NextResponse } from 'next/server';
import { importLeverSite } from '@/lib/importers/lever';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.IMPORT_SECRET;
  if (!secret) return NextResponse.json({ error: 'IMPORT_SECRET is not configured' }, { status: 503 });

  const supplied = request.headers.get('x-import-secret');
  if (supplied !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { site?: string };
  if (!body.site) return NextResponse.json({ error: 'site is required' }, { status: 400 });

  try {
    const result = await importLeverSite(body.site);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Import failed' }, { status: 500 });
  }
}
