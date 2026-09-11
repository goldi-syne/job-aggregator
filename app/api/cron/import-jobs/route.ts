import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { importLeverSite } from '@/lib/importers/lever';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type SourceRow = {
  source_type: string;
  site_id: string;
  company_name: string | null;
  default_country_code: string | null;
};

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

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sources')
    .select('source_type,site_id,company_name,default_country_code')
    .eq('enabled', true)
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sources = (data || []) as SourceRow[];
  const results: Array<Record<string, unknown>> = [];

  for (const source of sources) {
    try {
      if (source.source_type.toLowerCase() === 'lever') {
        const result = await importLeverSite(source.site_id, {
          companyName: source.company_name || undefined,
          defaultCountryCode: source.default_country_code || undefined,
        });
        results.push({ source: `Lever:${source.site_id}`, ok: true, ...result });
      } else {
        results.push({ source: `${source.source_type}:${source.site_id}`, ok: false, error: 'Unsupported source type' });
      }
    } catch (error) {
      results.push({
        source: `${source.source_type}:${source.site_id}`,
        ok: false,
        error: error instanceof Error ? error.message : 'Import failed',
      });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    sourceCount: sources.length,
    results,
  });
}
