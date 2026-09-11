import db from '../db';

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
  descriptionPlain?: string;
  additionalPlain?: string;
  lists?: Array<{ text?: string; content?: string }>;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function inferLocation(raw = '') {
  const remote = /remote/i.test(raw);
  const parts = raw.split(',').map(v => v.trim()).filter(Boolean);
  return {
    location: raw || (remote ? 'Remote' : 'Location not specified'),
    city: remote ? '' : (parts[0] || ''),
    state: remote ? '' : (parts[1] || ''),
    country: /canada/i.test(raw) ? 'Canada' : /india/i.test(raw) ? 'India' : /united kingdom|uk/i.test(raw) ? 'United Kingdom' : 'United States',
    countryCode: /canada/i.test(raw) ? 'CA' : /india/i.test(raw) ? 'IN' : /united kingdom|uk/i.test(raw) ? 'GB' : 'US',
    remote,
    workMode: remote ? 'Remote' : 'On-site',
  };
}

export async function importLeverSite(site: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(site)) throw new Error('Invalid Lever site name');
  const started = db.prepare('INSERT INTO import_runs (source) VALUES (?)').run(`lever:${site}`);
  const runId = Number(started.lastInsertRowid);

  try {
    const response = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Lever returned HTTP ${response.status}`);
    const postings = await response.json() as LeverPosting[];

    const upsert = db.prepare(`
      INSERT INTO jobs (
        slug, title, company, location, experience, job_type, skills, summary,
        apply_url, source, source_url, source_job_id, posted_at, remote,
        country_code, country, state, city, work_mode, category, status, updated_at
      ) VALUES (
        @slug, @title, @company, @location, '', @job_type, '[]', @summary,
        @apply_url, @source, @source_url, @source_job_id, @posted_at, @remote,
        @country_code, @country, @state, @city, @work_mode, @category, 'active', CURRENT_TIMESTAMP
      )
      ON CONFLICT(source, source_job_id) DO UPDATE SET
        title=excluded.title, location=excluded.location, job_type=excluded.job_type,
        summary=excluded.summary, apply_url=excluded.apply_url, source_url=excluded.source_url,
        posted_at=excluded.posted_at, remote=excluded.remote, country_code=excluded.country_code,
        country=excluded.country, state=excluded.state, city=excluded.city,
        work_mode=excluded.work_mode, category=excluded.category, status='active', updated_at=CURRENT_TIMESTAMP
    `);

    let imported = 0;
    const saveAll = db.transaction((items: LeverPosting[]) => {
      for (const posting of items) {
        const loc = inferLocation(posting.categories?.location || '');
        const summary = [posting.descriptionPlain, posting.additionalPlain]
          .filter(Boolean).join('\n\n').trim().slice(0, 8000) || 'View the original posting for complete job details.';
        upsert.run({
          slug: `${slugify(posting.text)}-${posting.id.slice(0, 8)}`,
          title: posting.text,
          company: site.replace(/[-_]/g, ' '),
          location: loc.location,
          job_type: posting.categories?.commitment || 'Full time',
          summary,
          apply_url: posting.applyUrl || posting.hostedUrl,
          source: `Lever:${site}`,
          source_url: posting.hostedUrl,
          source_job_id: posting.id,
          posted_at: new Date(posting.createdAt).toISOString(),
          remote: loc.remote ? 1 : 0,
          country_code: loc.countryCode,
          country: loc.country,
          state: loc.state,
          city: loc.city,
          work_mode: loc.workMode,
          category: posting.categories?.team || posting.categories?.department || '',
        });
        imported += 1;
      }
    });

    saveAll(postings);
    db.prepare('UPDATE import_runs SET finished_at=CURRENT_TIMESTAMP, imported_count=? WHERE id=?').run(imported, runId);
    return { site, imported };
  } catch (error) {
    db.prepare('UPDATE import_runs SET finished_at=CURRENT_TIMESTAMP, error=? WHERE id=?').run(error instanceof Error ? error.message : 'Unknown error', runId);
    throw error;
  }
}
