import db from './db';

export type Job = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  experience: string;
  jobType: string;
  skills: string[];
  summary: string;
  applyUrl: string;
  source: string;
  postedAt: string;
  remote?: boolean;
};

type JobRow = {
  id: number;
  slug: string;
  title: string;
  company: string;
  location: string;
  experience: string;
  job_type: string;
  skills: string;
  summary: string;
  apply_url: string;
  source: string;
  posted_at: string;
  remote: number;
};

function mapJob(row: JobRow): Job {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    company: row.company,
    location: row.location,
    experience: row.experience,
    jobType: row.job_type,
    skills: JSON.parse(row.skills || '[]'),
    summary: row.summary,
    applyUrl: row.apply_url,
    source: row.source,
    postedAt: row.posted_at,
    remote: Boolean(row.remote),
  };
}

export function getJobs(): Job[] {
  const rows = db.prepare(`
    SELECT * FROM jobs
    WHERE status = 'active'
    ORDER BY posted_at DESC, id DESC
  `).all() as JobRow[];

  return rows.map(mapJob);
}

export function getJob(slug: string): Job | undefined {
  const row = db.prepare(`
    SELECT * FROM jobs
    WHERE slug = ? AND status = 'active'
    LIMIT 1
  `).get(slug) as JobRow | undefined;

  return row ? mapJob(row) : undefined;
}

export function getJobById(id: string): Job | undefined {
  const row = db.prepare(`
    SELECT * FROM jobs
    WHERE id = ? AND status = 'active'
    LIMIT 1
  `).get(id) as JobRow | undefined;

  return row ? mapJob(row) : undefined;
}

export function recordClick(jobId: string, referrer?: string | null) {
  db.prepare(`
    INSERT INTO clicks (job_id, referrer)
    VALUES (?, ?)
  `).run(jobId, referrer || null);
}
