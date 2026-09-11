import { getSupabaseAdminClient } from '../supabase';

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  categories?: {
    commitment?: string;
    location?: string;
    team?: string;
    department?: string;
  };
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function inferLocation(raw = '') {
  const remote = /remote/i.test(raw);
  const parts = raw.split(',').map(v => v.trim()).filter(Boolean);
  const lower = raw.toLowerCase();
  let country = '';
  let countryCode = '';
  if (/united states|\busa\b|\bu\.s\.\b/i.test(raw)) { country = 'United States'; countryCode = 'US'; }
  else if (/canada/i.test(raw)) { country = 'Canada'; countryCode = 'CA'; }
  else if (/india/i.test(raw)) { country = 'India'; countryCode = 'IN'; }
  else if (/united kingdom|\buk\b|england|scotland|wales/i.test(raw)) { country = 'United Kingdom'; countryCode = 'GB'; }
  else if (/australia/i.test(raw)) { country = 'Australia'; countryCode = 'AU'; }

  const workMode = remote ? 'Remote' : /hybrid/i.test(lower) ? 'Hybrid' : 'On-site';
  return {
    location: raw || (remote ? 'Remote' : 'Location not specified'),
    city: remote ? '' : (parts[0] || ''),
    state: remote ? '' : (parts[1] || ''),
    country,
    countryCode,
    remote,
    workMode,
  };
}

function buildSummary(posting: LeverPosting, company: string, location: string) {
  const commitment = posting.categories?.commitment || 'role';
  const where = location && location !== 'Location not specified' ? ` in ${location}` : '';
  return `${company} is hiring for ${posting.text}${where}. This is listed as a ${commitment} opportunity. Review the original employer posting for complete responsibilities, qualifications, compensation, eligibility and application details.`;
}

export async function importLeverSite(site: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(site)) throw new Error('Invalid Lever site name');
  const supabase = getSupabaseAdminClient();
  const source = `Lever:${site}`;
  const company = site.replace(/[-_]/g, ' ');

  const { data: run, error: runError } = await supabase
    .from('import_runs')
    .insert({ source })
    .select('id')
    .single();
  if (runError) throw new Error(runError.message);

  try {
    const response = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Lever returned HTTP ${response.status}`);
    const postings = await response.json() as LeverPosting[];

    const rows = postings.map(posting => {
      const loc = inferLocation(posting.categories?.location || '');
      return {
        slug: `${slugify(posting.text)}-${posting.id.slice(0, 8)}`,
        title: posting.text,
        company,
        location: loc.location,
        experience: '',
        job_type: posting.categories?.commitment || 'Full time',
        skills: [],
        summary: buildSummary(posting, company, loc.location),
        apply_url: posting.applyUrl || posting.hostedUrl,
        source,
        source_url: posting.hostedUrl,
        source_job_id: posting.id,
        posted_at: new Date(posting.createdAt).toISOString(),
        remote: loc.remote,
        country_code: loc.countryCode,
        country: loc.country,
        state: loc.state,
        city: loc.city,
        work_mode: loc.workMode,
        category: posting.categories?.team || posting.categories?.department || '',
        status: 'active',
        updated_at: new Date().toISOString(),
      };
    });

    if (rows.length) {
      const { error } = await supabase.from('jobs').upsert(rows, { onConflict: 'source,source_job_id' });
      if (error) throw new Error(error.message);
    }

    await supabase.from('import_runs').update({ finished_at: new Date().toISOString(), imported_count: rows.length }).eq('id', run.id);
    return { site, imported: rows.length };
  } catch (error) {
    await supabase.from('import_runs').update({ finished_at: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown error' }).eq('id', run.id);
    throw error;
  }
}
