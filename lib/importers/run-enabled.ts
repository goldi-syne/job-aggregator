import { getSupabaseAdminClient } from '../supabase';
import { importLeverSite } from './lever';

type SourceRow = {
  source_type: string;
  site_id: string;
  company_name: string | null;
  default_country_code: string | null;
};

export async function runEnabledImports() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sources')
    .select('source_type,site_id,company_name,default_country_code')
    .eq('enabled', true)
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);

  const sources = (data || []) as SourceRow[];
  const results: Array<Record<string, unknown>> = [];
  const batchSize = 4;

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(async source => {
      if (source.source_type.toLowerCase() !== 'lever') {
        return { source: `${source.source_type}:${source.site_id}`, ok: false, error: 'Unsupported source type' };
      }
      const result = await importLeverSite(source.site_id, {
        companyName: source.company_name || undefined,
        defaultCountryCode: source.default_country_code || undefined,
      });
      return { source: `Lever:${source.site_id}`, ok: true, ...result };
    }));

    settled.forEach((item, index) => {
      if (item.status === 'fulfilled') results.push(item.value);
      else {
        const source = batch[index];
        results.push({
          source: `${source.source_type}:${source.site_id}`,
          ok: false,
          error: item.reason instanceof Error ? item.reason.message : 'Import failed',
        });
      }
    });
  }

  return {
    ranAt: new Date().toISOString(),
    sourceCount: sources.length,
    successCount: results.filter(r => r.ok === true).length,
    failureCount: results.filter(r => r.ok !== true).length,
    importedCount: results.reduce((sum, r) => sum + (typeof r.imported === 'number' ? r.imported : 0), 0),
    results,
  };
}
