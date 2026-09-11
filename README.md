# JobPulse

JobPulse is a no-login job discovery site focused on the United States with worldwide coverage. Candidates search normalized listings on JobPulse and apply on the original employer or ATS website.

## Features

- Responsive homepage and global job search
- US-first browsing with worldwide support
- Keyword, location, country, job type and work-mode filters
- Pagination and empty states
- Individual SEO-friendly job pages
- `JobPosting` structured data
- Related jobs
- Outbound apply redirects with click tracking
- Supabase production database
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

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Set these variables locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
IMPORT_SECRET=use-a-long-random-secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

The publishable key is used for public job reads under Row Level Security. The secret key is server-only and is used for imports and click tracking. Never commit the secret key.

## Lever importer

Send a POST request to `/api/import/lever` with header `x-import-secret` and JSON body:

```json
{ "site": "lever-site-name" }
```

The importer writes through the server-only Supabase client, deduplicates on source + source job ID, and creates a concise original summary instead of republishing the full source description.

Only import sources whose public feed/API and terms permit aggregation. Do not scrape LinkedIn.

## Vercel deployment

1. Import this GitHub repository into Vercel.
2. Add the environment variables above for Production, Preview and Development as appropriate.
3. Deploy.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS domain and redeploy so canonical URLs and the sitemap use the production domain.
5. Verify `/`, `/jobs`, one job detail page, `/sitemap.xml`, and an outbound `/go/{id}` redirect.

## Before public launch

- Run the Supabase schema.
- Add permitted real job sources.
- Rotate any secret key that has ever been exposed.
- Configure analytics.
- Add ad network code only after approval.
- Add scheduled imports/expiry synchronization when source coverage is ready.
