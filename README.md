# JobPulse

JobPulse is a no-login job discovery site focused on the United States with worldwide coverage. Candidates search normalized listings on JobPulse and apply on the original employer or ATS website.

## Features

- Responsive homepage and global job search
- US-first browsing with worldwide support
- Keyword, location, country, job type and work-mode filters
- Pagination and empty states
- Individual SEO-friendly job pages
- `JobPosting` structured data for active job pages
- Related jobs
- Outbound apply redirects with click tracking
- Local SQLite development database
- Supabase production schema in `supabase/schema.sql`
- Lever public job-board importer with source deduplication
- Dynamic sitemap and robots configuration
- About, Privacy and Terms pages
- Advertisement placeholders ready for an approved ad provider
- GitHub Actions typecheck + production build validation

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Demo jobs are disabled by default. To use the local sample listings during development only, set:

```env
SEED_DEMO_JOBS=true
```

## Import a Lever job board locally

Set a long `IMPORT_SECRET` in `.env.local`, start the app and send a POST request to `/api/import/lever` with header `x-import-secret` and JSON body:

```json
{ "site": "lever-site-name" }
```

Only import job sources whose public feed/API and terms permit this use. Do not scrape LinkedIn or republish restricted content.

## Production database

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Configure the Supabase URL, publishable key and service-role key as server environment variables.
4. Complete the Supabase data-adapter activation before deploying the database-backed site to Vercel.

The current application continues to use SQLite until that production adapter is activated, so SQLite should be treated as local development storage only.

## Deployment checklist

- Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain.
- Use an online persistent database before public Vercel deployment.
- Import only permitted job sources and keep expired jobs inactive.
- Configure analytics after choosing a provider.
- Add an approved advertising provider only after its site/account approval.
- Keep private keys and import secrets in deployment environment variables, never in GitHub.
