import { NextResponse } from 'next/server';
import { runEnabledImports } from '@/lib/importers/run-enabled';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LOCK_SOURCE = 'System:bootstrap-import';

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from('import_runs')
    .select('id,started_at,finished_at,imported_count,error')
    .eq('source', LOCK_SOURCE)
    .gte('started_at', cutoff)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: !existing.error,
      alreadyRan: true,
      startedAt: existing.started_at,
      finishedAt: existing.finished_at,
      importedCount: existing.imported_count,
      error: existing.error,
    });
  }

  const { data: lock, error: lockError } = await supabase
    .from('import_runs')
    .insert({ source: LOCK_SOURCE })
    .select('id')
    .single();

  if (lockError) {
    return NextResponse.json({ error: lockError.message }, { status: 500 });
  }

  try {
    const result = await runEnabledImports();
    await supabase
      .from('import_runs')
      .update({
        finished_at: new Date().toISOString(),
        imported_count: result.importedCount,
      })
      .eq('id', lock.id);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed';
    await supabase
      .from('import_runs')
      .update({ finished_at: new Date().toISOString(), error: message })
      .eq('id', lock.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
