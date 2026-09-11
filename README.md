# JobPulse India

Fast, no-login job discovery site that sends candidates to the original application source.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Current MVP
- Responsive homepage
- Latest-jobs listing and search
- Fresher and remote filters
- Individual SEO-friendly job routes
- Outbound `/go/:id` apply redirects
- Ad placeholders ready for an ad provider
- Supabase production schema in `supabase/schema.sql`
- Demo listings are clearly sample data

## Next production steps
1. Create Supabase project and run `supabase/schema.sql`.
2. Add environment variables for Supabase.
3. Replace demo in-memory data with database reads.
4. Add approved job-feed / employer ATS importers and deduplication.
5. Add click logging to outbound redirects.
6. Add sitemap/robots and analytics.
7. Insert the chosen ad network only after account/site approval.

Do not scrape or republish sources in violation of their terms. Prefer employer career pages, ATS feeds/APIs and other sources that permit aggregation.
