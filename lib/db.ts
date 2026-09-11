import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'jobs.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

  CREATE TABLE IF NOT EXISTS import_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    imported_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    error TEXT
  );
`);

function ensureColumn(name: string, definition: string) {
  const columns = db.prepare('PRAGMA table_info(jobs)').all() as Array<{ name: string }>;
  if (!columns.some(column => column.name === name)) {
    db.exec(`ALTER TABLE jobs ADD COLUMN ${name} ${definition}`);
  }
}

ensureColumn('country_code', "TEXT NOT NULL DEFAULT 'US'");
ensureColumn('country', "TEXT NOT NULL DEFAULT 'United States'");
ensureColumn('state', "TEXT NOT NULL DEFAULT ''");
ensureColumn('city', "TEXT NOT NULL DEFAULT ''");
ensureColumn('work_mode', "TEXT NOT NULL DEFAULT 'On-site'");
ensureColumn('category', "TEXT NOT NULL DEFAULT ''");
ensureColumn('salary_min', 'INTEGER');
ensureColumn('salary_max', 'INTEGER');
ensureColumn('salary_currency', "TEXT NOT NULL DEFAULT 'USD'");
ensureColumn('source_job_id', 'TEXT');
ensureColumn('source_url', 'TEXT');
ensureColumn('expires_at', 'TEXT');
ensureColumn('updated_at', 'TEXT');

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_country_code ON jobs(country_code);
  CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
  CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
  CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(remote);
  CREATE INDEX IF NOT EXISTS idx_clicks_job_id ON clicks(job_id);
  DROP INDEX IF EXISTS idx_jobs_source_identity;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_identity ON jobs(source, source_job_id);
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM jobs').get() as { count: number };

if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO jobs (
      slug, title, company, location, experience, job_type, skills, summary,
      apply_url, source, posted_at, remote, country_code, country, state, city,
      work_mode, category, salary_min, salary_max, salary_currency
    ) VALUES (
      @slug, @title, @company, @location, @experience, @job_type, @skills, @summary,
      @apply_url, @source, @posted_at, @remote, @country_code, @country, @state, @city,
      @work_mode, @category, @salary_min, @salary_max, @salary_currency
    )
  `);

  const seedJobs = [
    {
      slug: 'security-analyst-new-york-demo', title: 'Security Analyst', company: 'Demo Security',
      location: 'New York, NY, United States', experience: '1–3 years', job_type: 'Full time',
      skills: JSON.stringify(['SIEM', 'EDR', 'Incident Response']),
      summary: 'Monitor security alerts, investigate incidents and support security operations. Sample listing for local development.',
      apply_url: 'https://example.com', source: 'Demo employer source', posted_at: '2026-09-11', remote: 0,
      country_code: 'US', country: 'United States', state: 'New York', city: 'New York', work_mode: 'On-site',
      category: 'Cybersecurity', salary_min: 75000, salary_max: 105000, salary_currency: 'USD'
    },
    {
      slug: 'software-engineer-austin-demo', title: 'Software Engineer', company: 'Demo Cloud',
      location: 'Austin, TX, United States', experience: '2–4 years', job_type: 'Full time',
      skills: JSON.stringify(['TypeScript', 'React', 'Node.js']),
      summary: 'Build and maintain web applications and APIs. Sample listing for local development.',
      apply_url: 'https://example.com', source: 'Demo employer source', posted_at: '2026-09-11', remote: 0,
      country_code: 'US', country: 'United States', state: 'Texas', city: 'Austin', work_mode: 'Hybrid',
      category: 'Software Engineering', salary_min: 95000, salary_max: 135000, salary_currency: 'USD'
    },
    {
      slug: 'cloud-support-remote-us-demo', title: 'Cloud Support Engineer', company: 'Demo Infrastructure',
      location: 'Remote, United States', experience: '0–2 years', job_type: 'Full time',
      skills: JSON.stringify(['AWS', 'Linux', 'Networking']),
      summary: 'Troubleshoot cloud infrastructure and support customer environments. Sample listing for local development.',
      apply_url: 'https://example.com', source: 'Demo employer source', posted_at: '2026-09-11', remote: 1,
      country_code: 'US', country: 'United States', state: '', city: '', work_mode: 'Remote',
      category: 'Cloud & Infrastructure', salary_min: 65000, salary_max: 90000, salary_currency: 'USD'
    }
  ];

  const seed = db.transaction(() => {
    for (const job of seedJobs) insert.run(job);
  });
  seed();
}

export default db;
