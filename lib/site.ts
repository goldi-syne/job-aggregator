export const site = {
  name: 'JobPulse',
  description: 'Search fresh jobs across the United States and worldwide, then apply directly on the original employer or ATS website.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@jobpulse.example',
};

export function absoluteUrl(path = '/') {
  return new URL(path, site.url).toString();
}
