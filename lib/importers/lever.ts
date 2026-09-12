import { getSupabaseAdminClient } from '../supabase';

type LeverList = {
  text?: string;
  content?: string;
};

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  country?: string | null;
  descriptionPlain?: string;
  additionalPlain?: string;
  workplaceType?: 'on-site' | 'hybrid' | 'remote' | 'unspecified' | string;
  salaryDescriptionPlain?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  };
  lists?: LeverList[];
  categories?: {
    commitment?: string;
    location?: string;
    team?: string;
    department?: string;
    level?: string;
    allLocations?: string[];
  };
};

type LeverImportOptions = {
  companyName?: string;
  defaultCountryCode?: string;
  lookbackDays?: number;
};

type JobSection = {
  title: string;
  items: string[];
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function decodeHtml(value = '') {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToText(value = '') {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function listItems(content = '') {
  const liMatches = [...content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(match => htmlToText(match[1]))
    .filter(Boolean);
  if (liMatches.length) return liMatches;

  return htmlToText(content)
    .split(/\n+/)
    .map(item => item.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function countryNameFromCode(code = '') {
  const normalized = code.toUpperCase();
  if (normalized === 'US') return 'United States';
  if (normalized === 'CA') return 'Canada';
  if (normalized === 'IN') return 'India';
  if (normalized === 'GB') return 'United Kingdom';
  if (normalized === 'AU') return 'Australia';
  return '';
}

function inferLocation(raw = '', defaultCountryCode = '', postingCountry = '', workplaceType = '') {
  const remote = workplaceType === 'remote' || /remote/i.test(raw);
  const parts = raw.split(',').map(v => v.trim()).filter(Boolean);
  const lower = raw.toLowerCase();
  let country = '';
  let countryCode = postingCountry?.toUpperCase() || '';

  if (countryCode) country = countryNameFromCode(countryCode);
  if (!countryCode && /united states|\busa\b|\bu\.s\.\b/i.test(raw)) { country = 'United States'; countryCode = 'US'; }
  else if (!countryCode && /canada/i.test(raw)) { country = 'Canada'; countryCode = 'CA'; }
  else if (!countryCode && /india/i.test(raw)) { country = 'India'; countryCode = 'IN'; }
  else if (!countryCode && /united kingdom|\buk\b|england|scotland|wales/i.test(raw)) { country = 'United Kingdom'; countryCode = 'GB'; }
  else if (!countryCode && /australia/i.test(raw)) { country = 'Australia'; countryCode = 'AU'; }
  else if (!countryCode && defaultCountryCode) {
    countryCode = defaultCountryCode.toUpperCase();
    country = countryNameFromCode(countryCode);
  }

  const workMode = workplaceType === 'hybrid' || /hybrid/i.test(lower)
    ? 'Hybrid'
    : remote
      ? 'Remote'
      : workplaceType === 'on-site'
        ? 'On-site'
        : 'On-site';

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
  const description = posting.descriptionPlain?.trim();
  if (description) return description;

  const commitment = posting.categories?.commitment || 'role';
  const where = location && location !== 'Location not specified' ? ` in ${location}` : '';
  return `${company} is hiring for ${posting.text}${where}. This is listed as a ${commitment} opportunity.`;
}

function buildSections(posting: LeverPosting): JobSection[] {
  return (posting.lists || [])
    .map(list => ({
      title: list.text?.trim() || 'Additional details',
      items: listItems(list.content || ''),
    }))
    .filter(section => section.items.length > 0);
}

function extractExperience(posting: LeverPosting, sections: JobSection[]) {
  if (posting.categories?.level?.trim()) return posting.categories.level.trim();

  const searchable = [
    posting.descriptionPlain || '',
    ...sections.flatMap(section => [section.title, ...section.items]),
  ].join(' ');

  const contextMatch = searchable.match(/[^.!?]{0,90}\b(\d{1,2}\+?\s*(?:[-–]\s*\d{1,2})?\s*(?:years?|yrs?))\b[^.!?]{0,90}(?:experience|professional|industry|work)[^.!?]*/i)
    || searchable.match(/[^.!?]{0,90}(?:experience|professional|industry|work)[^.!?]{0,90}\b(\d{1,2}\+?\s*(?:[-–]\s*\d{1,2})?\s*(?:years?|yrs?))\b[^.!?]*/i);
  if (contextMatch?.[1]) return contextMatch[1].replace(/\s+/g, ' ').trim();

  const generic = searchable.match(/\b\d{1,2}\+?\s*(?:[-–]\s*\d{1,2})?\s*(?:years?|yrs?)\b/i);
  return generic?.[0]?.replace(/\s+/g, ' ').trim() || '';
}

function extractSkills(sections: JobSection[]) {
  const skillSection = sections.find(section => /skill|technical|technology|tools|stack/i.test(section.title));
  if (!skillSection) return [];
  return skillSection.items
    .flatMap(item => item.split(/[,;/|]/))
    .map(item => item.trim())
    .filter(item => item.length >= 2 && item.length <= 60)
    .slice(0, 20);
}

export async function importLeverSite(site: string, options: LeverImportOptions = {}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(site)) throw new Error('Invalid Lever site name');
  const supabase = getSupabaseAdminClient();
  const source = `Lever:${site}`;
  const company = options.companyName?.trim() || site.replace(/[-_]/g, ' ');
  const lookbackDays = Math.max(1, Math.min(options.lookbackDays ?? 3, 30));
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

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
    const recentPostings = postings.filter(posting => Number.isFinite(posting.createdAt) && posting.createdAt >= cutoff);

    const rows = recentPostings.map(posting => {
      const sections = buildSections(posting);
      const loc = inferLocation(
        posting.categories?.location || '',
        options.defaultCountryCode || '',
        posting.country || '',
        posting.workplaceType || '',
      );
      const summary = buildSummary(posting, company, loc.location);
      const additional = posting.additionalPlain?.trim() || '';
      return {
        slug: `${slugify(posting.text)}-${posting.id.slice(0, 8)}`,
        title: posting.text,
        company,
        location: loc.location,
        experience: extractExperience(posting, sections),
        job_type: posting.categories?.commitment || 'Full time',
        skills: extractSkills(sections),
        summary,
        description: additional,
        sections,
        salary_description: posting.salaryDescriptionPlain?.trim() || '',
        salary_min: posting.salaryRange?.min ?? null,
        salary_max: posting.salaryRange?.max ?? null,
        salary_currency: posting.salaryRange?.currency || 'USD',
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

    const recentIds = new Set(rows.map(row => row.source_job_id));
    const { data: existingRows, error: existingError } = await supabase
      .from('jobs')
      .select('source_job_id,status')
      .eq('source', source);
    if (existingError) throw new Error(existingError.message);

    const existingIds = new Set((existingRows || []).map(row => String(row.source_job_id || '')));
    const activeIds = new Set((existingRows || []).filter(row => row.status === 'active').map(row => String(row.source_job_id || '')));
    const newCount = rows.filter(row => !existingIds.has(row.source_job_id)).length;
    const updatedCount = rows.length - newCount;
    const deactivatedCount = [...activeIds].filter(id => id && !recentIds.has(id)).length;

    const now = new Date().toISOString();
    const { error: deactivateError } = await supabase
      .from('jobs')
      .update({ status: 'inactive', updated_at: now })
      .eq('source', source)
      .eq('status', 'active');
    if (deactivateError) throw new Error(deactivateError.message);

    if (rows.length) {
      const { error } = await supabase.from('jobs').upsert(rows, { onConflict: 'source,source_job_id' });
      if (error) throw new Error(error.message);
    }

    await supabase.from('import_runs').update({ finished_at: new Date().toISOString(), imported_count: rows.length }).eq('id', run.id);
    return { site, imported: rows.length, newCount, updatedCount, deactivatedCount, lookbackDays, available: postings.length };
  } catch (error) {
    await supabase.from('import_runs').update({ finished_at: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown error' }).eq('id', run.id);
    throw error;
  }
}
