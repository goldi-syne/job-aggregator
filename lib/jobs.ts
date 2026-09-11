import { getSupabaseAdminClient, getSupabasePublicClient } from './supabase';

export type Job = {
  id: string; slug: string; title: string; company: string; location: string;
  experience: string; jobType: string; skills: string[]; summary: string;
  applyUrl: string; source: string; sourceUrl?: string; postedAt: string;
  expiresAt?: string; remote: boolean; countryCode: string; country: string;
  state: string; city: string; workMode: string; category: string;
  salaryMin?: number; salaryMax?: number; salaryCurrency: string;
};

type JobRow = {
  id: string; slug: string; title: string; company: string; location: string;
  experience: string | null; job_type: string | null; skills: string[] | null; summary: string | null;
  apply_url: string; source: string; source_url: string | null; posted_at: string;
  expires_at: string | null; remote: boolean | null; country_code: string | null; country: string | null;
  state: string | null; city: string | null; work_mode: string | null; category: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null;
};

export type JobFilters = {
  q?: string; location?: string; country?: string; state?: string; jobType?: string;
  category?: string; workMode?: string; remote?: boolean;
};

function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    location: row.location || '',
    experience: row.experience || '',
    jobType: row.job_type || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    summary: row.summary || 'View the original posting for complete job details.',
    applyUrl: row.apply_url,
    source: row.source,
    sourceUrl: row.source_url || undefined,
    postedAt: row.posted_at,
    expiresAt: row.expires_at || undefined,
    remote: Boolean(row.remote),
    countryCode: row.country_code || '',
    country: row.country || '',
    state: row.state || '',
    city: row.city || '',
    workMode: row.work_mode || '',
    category: row.category || '',
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    salaryCurrency: row.salary_currency || 'USD',
  };
}

export async function getJobs(filters: JobFilters = {}): Promise<Job[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('posted_at', { ascending: false })
    .limit(1000);

  if (filters.country) query = query.eq('country_code', filters.country.toUpperCase());
  if (filters.state) query = query.ilike('state', filters.state);
  if (filters.jobType) query = query.ilike('job_type', filters.jobType);
  if (filters.category) query = query.ilike('category', filters.category);
  if (filters.workMode) query = query.ilike('work_mode', filters.workMode);
  if (filters.remote) query = query.eq('remote', true);

  const { data, error } = await query;
  if (error) {
    console.error('Supabase getJobs error:', error.message);
    return [];
  }

  const today = new Date();
  const q = filters.q?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();

  return ((data || []) as JobRow[])
    .map(mapJob)
    .filter(job => !job.expiresAt || new Date(job.expiresAt) >= today)
    .filter(job => {
      if (q && !`${job.title} ${job.company} ${job.skills.join(' ')} ${job.category}`.toLowerCase().includes(q)) return false;
      if (location && !`${job.location} ${job.city} ${job.state} ${job.country}`.toLowerCase().includes(location)) return false;
      return true;
    });
}

export async function getJob(slug: string): Promise<Job | undefined> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase.from('jobs').select('*').eq('slug', slug).eq('status', 'active').maybeSingle();
  if (error || !data) return undefined;
  const job = mapJob(data as JobRow);
  if (job.expiresAt && new Date(job.expiresAt) < new Date()) return undefined;
  return job;
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).eq('status', 'active').maybeSingle();
  if (error || !data) return undefined;
  const job = mapJob(data as JobRow);
  if (job.expiresAt && new Date(job.expiresAt) < new Date()) return undefined;
  return job;
}

export async function getRelatedJobs(job: Job, limit = 4): Promise<Job[]> {
  const jobs = await getJobs(job.countryCode ? { country: job.countryCode } : {});
  return jobs
    .filter(candidate => candidate.id !== job.id && (candidate.category === job.category || candidate.city === job.city || candidate.remote === job.remote))
    .slice(0, limit);
}

export async function recordClick(jobId: string, referrer?: string | null) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('outbound_clicks').insert({ job_id: jobId, referrer: referrer || null });
    if (error) console.error('Supabase click insert error:', error.message);
  } catch (error) {
    console.error('Click tracking unavailable:', error instanceof Error ? error.message : error);
  }
}

export function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: job.salaryCurrency || 'USD', maximumFractionDigits: 0 });
  if (job.salaryMin && job.salaryMax) return `${formatter.format(job.salaryMin)}–${formatter.format(job.salaryMax)}`;
  return formatter.format(job.salaryMin || job.salaryMax || 0);
}
