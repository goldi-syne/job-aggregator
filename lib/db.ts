import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'jobs.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    experience TEXT NOT NULL DEFAULT '',
    job_type TEXT NOT NULL DEFAULT 'Full time',
    skills TEXT NOT NULL DEFAULT '[]',
    summary TEXT NOT NULL DEFAULT '',
    apply_url TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '',
    posted_at TEXT NOT NULL,
    remote INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referrer TEXT,
    FOREIGN KEY(job_id) REFERENCES jobs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
  CREATE INDEX IF NOT EXISTS idx_clicks_job_id ON clicks(job_id);
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM jobs').get() as { count: number };

if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO jobs (
      slug, title, company, location, experience, job_type,
      skills, summary, apply_url, source, posted_at, remote
    ) VALUES (
      @slug, @title, @company, @location, @experience, @job_type,
      @skills, @summary, @apply_url, @source, @posted_at, @remote
    )
  `);

  const seedJobs = [
    {
      slug: 'soc-analyst-pune-demo',
      title: 'SOC Analyst',
      company: 'Demo Technology',
      location: 'Pune, Maharashtra',
      experience: '0–2 years',
      job_type: 'Full time',
      skills: JSON.stringify(['SIEM', 'Microsoft Sentinel', 'EDR']),
      summary: 'Monitor security alerts, investigate incidents and support SOC operations. This sample listing demonstrates the job-page format.',
      apply_url: 'https://example.com',
      source: 'Employer career page',
      posted_at: '2026-09-11',
      remote: 0,
    },
    {
      slug: 'cloud-support-bengaluru-demo',
      title: 'Cloud Support Engineer',
      company: 'Demo Cloud',
      location: 'Bengaluru, Karnataka',
      experience: '0–2 years',
      job_type: 'Full time',
      skills: JSON.stringify(['AWS', 'Linux', 'Networking']),
      summary: 'Support cloud infrastructure and troubleshoot customer environments. Sample data only.',
      apply_url: 'https://example.com',
      source: 'Employer career page',
      posted_at: '2026-09-11',
      remote: 0,
    },
    {
      slug: 'security-engineer-remote-demo',
      title: 'Junior Security Engineer',
      company: 'Demo Security',
      location: 'Remote, India',
      experience: 'Fresher',
      job_type: 'Full time',
      skills: JSON.stringify(['Security', 'Networking', 'Python']),
      summary: 'Assist with security monitoring, vulnerability management and automation. Sample data only.',
      apply_url: 'https://example.com',
      source: 'Employer career page',
      posted_at: '2026-09-11',
      remote: 1,
    },
  ];

  const seed = db.transaction(() => {
    for (const job of seedJobs) insert.run(job);
  });

  seed();
}

export default db;
