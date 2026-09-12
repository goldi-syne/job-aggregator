import { NextResponse } from 'next/server';
import { runEnabledImports } from '@/lib/importers/run-enabled';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const importSecret = process.env.IMPORT_SECRET;
  const authorization = request.headers.get('authorization');
  const importHeader = request.headers.get('x-import-secret');

  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;
  if (importSecret && importHeader === importSecret) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runEnabledImports();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Import failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
