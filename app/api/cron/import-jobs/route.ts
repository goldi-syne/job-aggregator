import { NextResponse } from 'next/server';
import { runEnabledImports } from '@/lib/importers/run-enabled';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const importSecret = process.env.IMPORT_SECRET;
  const authorization = request.headers.get('authorization');
  const importHeader = request.headers.get('x-import-secret');

  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;
  if (importSecret && importHeader === importSecret) return true;

  // Fallback for Vercel Cron when CRON_SECRET is not available in the
  // production environment. Vercel adds this schedule header to cron calls.
  // The database guard below ensures this fallback cannot trigger repeatedly.
  if (!cronSecret && request.headers.get('x-vercel-cron-schedule') === '15 3 * * *') {
    const supabase = getSupabaseAdminClient();
    const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('import_runs')
      .select('id')
      .gte('started_at', cutoff)
      .limit(1);

    if (!error && (!data || data.length === 0)) return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
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
