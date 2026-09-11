import db from './db';

export type Job = {
  id: string; slug: string; title: string; company: string; location: string;
  experience: string; jobType: string; skills: string[]; summary: string;
  applyUrl: string; source: string; sourceUrl?: string; postedAt: string;
  expiresAt?: string; remote: boolean; countryCode: string; country: string;
  state: string; city: string; workMode: string; category: string;
  salaryMin?: number; salaryMax?: number; salaryCurrency: string;
};

type JobRow = {
  id: number; slug: string; title: string; company: string; location: string;
  experience: string; job_type: string; skills: string; summary: string;
  apply_url: string; source: string; source_url: string | null; posted_at: string;
  expires_at: string | null; remote: number; country_code: string; country: string;
  state: string; city: string; work_mode: string; category: string;
  salary_min: number | null; salary_max: number | null; salary_currency: string;
};

export type JobFilters = {
  q?: string; location?: string; country?: string; state?: string; jobType?: string;
  category?: string; workMode?: string; remote?: boolean;
};

function mapJob(row: JobRow): Job {
  let skills: string[] = [];
  try { skills = JSON.parse(row.skills || '[]'); } catch { skills = []; }
  return {
    id: String(row.id), slug: row.slug, title: row.title, company: row.company,
    location: row.location, experience: row.experience, jobType: row.job_type,
    skills, summary: row.summary, applyUrl: row.apply_url,
    source: row.source, sourceUrl: row.source_url || undefined, postedAt: row.posted_at,
    expiresAt: row.expires_at || undefined, remote: Boolean(row.remote),
    countryCode: row.country_code, country: row.country, state: row.state, city: row.city,
    workMode: row.work_mode, category: row.category,
    salaryMin: row.salary_min ?? undefined, salaryMax: row.salary_max ?? undefined,
    salaryCurrency: row.salary_currency,
  };
}

export function getJobs(filters: JobFilters = {}): Job[] {
  const rows = db.prepare(`
    SELECT * FROM jobs
    WHERE status = 'active'
      AND (expires_at IS NULL OR expires_at = '' OR expires_at >= date('now'))
    ORDER BY posted_at DESC, id DESC
  `).all() as JobRow[];

  const q = filters.q?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();

  return rows.map(mapJob).filter(job => {
    if (q && !`${job.title} ${job.company} ${job.skills.join(' ')} ${job.category}`.toLowerCase().includes(q)) return false;
    if (location && !`${job.location} ${job.city} ${job.state} ${job.country}`.toLowerCase().includes(location)) return false;
    if (filters.country && job.countryCode.toLowerCase() !== filters.country.toLowerCase()) return false;
    if (filters.state && job.state.toLowerCase() !== filters.state.toLowerCase()) return false;
    if (filters.jobType && job.jobType.toLowerCase() !== filters.jobType.toLowerCase()) return false;
    if (filters.category && job.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters.workMode && job.workMode.toLowerCase() !== filters.workMode.toLowerCase()) return false;
    if (filters.remote && !job.remote) return false;
    return true;
  });
}

export function getJob(slug: string): Job | undefined {
  const row = db.prepare(`SELECT * FROM jobs WHERE slug = ? AND status = 'active' LIMIT 1`).get(slug) as JobRow | undefined;
  return row ? mapJob(row) : undefined;
}

export function getJobById(id: string): Job | undefined {
  const row = db.prepare(`SELECT * FROM jobs WHERE id = ? AND status = 'active' LIMIT 1`).get(id) as JobRow | undefined;
  return row ? mapJob(row) : undefined;
}

export function getRelatedJobs(job: Job, limit = 4): Job[] {
  return getJobs({ country: job.countryCode }).filter(candidate => candidate.id !== job.id && (candidate.category === job.category || candidate.city === job.city || candidate.remote === job.remote)).slice(0, limit);
}

export function recordClick(jobId: string, referrer?: string | null) {
  db.prepare(`INSERT INTO clicks (job_id, referrer) VALUES (?, ?)`).run(jobId, referrer || null);
}

export function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: job.salaryCurrency || 'USD', maximumFractionDigits: 0 });
  if (job.salaryMin && job.salaryMax) return `${formatter.format(job.salaryMin)}–${formatter.format(job.salaryMax)}`;
  return formatter.format(job.salaryMin || job.salaryMax || 0);
}
