import type { MetadataRoute } from 'next';
import { getJobs } from '@/lib/jobs';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/jobs'), changeFrequency: 'hourly', priority: 0.9 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/terms'), changeFrequency: 'yearly', priority: 0.2 },
  ];

  const jobRoutes: MetadataRoute.Sitemap = getJobs().map(job => ({
    url: absoluteUrl(`/jobs/${job.slug}`),
    lastModified: job.postedAt ? new Date(job.postedAt) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...jobRoutes];
}
