import type { Metadata } from 'next';
import { formatSalary, getJob, getRelatedJobs } from '@/lib/jobs';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{slug:string}> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) return { title: 'Job not found' };
  const description = `${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ''}. View details and apply on the original source.`;
  return {
    title: `${job.title} at ${job.company}`,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title: `${job.title} at ${job.company}`, description, type: 'article' },
  };
}

export default async function JobPage({params}:Props){
  const {slug}=await params;
  const job=getJob(slug);
  if(!job) notFound();
  const salary = formatSalary(job);
  const related = getRelatedJobs(job, 4);

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org/', '@type': 'JobPosting', title: job.title,
    description: job.summary, datePosted: job.postedAt,
    employmentType: job.jobType.toUpperCase().replace(/[^A-Z]+/g, '_').replace(/^_|_$/g, ''),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    url: job.sourceUrl || job.applyUrl,
  };
  if (job.expiresAt) structuredData.validThrough = job.expiresAt;
  if (job.remote) {
    structuredData.jobLocationType = 'TELECOMMUTE';
    if (job.country) structuredData.applicantLocationRequirements = { '@type': 'Country', name: job.country };
  } else {
    structuredData.jobLocation = { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.city || undefined, addressRegion: job.state || undefined, addressCountry: job.countryCode || undefined } };
  }
  if (job.salaryMin || job.salaryMax) structuredData.baseSalary = { '@type': 'MonetaryAmount', currency: job.salaryCurrency || 'USD', value: { '@type': 'QuantitativeValue', minValue: job.salaryMin, maxValue: job.salaryMax, unitText: 'YEAR' } };
  const jsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
    <section className="wrap detail">
      <a className="back" href="/jobs">← Back to jobs</a>
      <div className="detailGrid">
        <article>
          <span className="fresh">{job.countryCode || 'GLOBAL'} · {job.workMode || 'Flexible'}</span>
          <h1>{job.title}</h1><h2>{job.company}</h2>
          <div className="facts"><span>📍 {job.location}</span><span>💼 {job.experience || job.jobType}</span><span>⏱ {job.jobType}</span>{salary && <span>💰 {salary}</span>}</div>
          <div className="ad">Advertisement</div>
          <h2>About the role</h2><p>{job.summary}</p>
          {job.category && <><h2>Category</h2><p><a href={`/jobs?category=${encodeURIComponent(job.category)}`}>{job.category}</a></p></>}
          {job.skills.length > 0 && <><h2>Skills</h2><div className="skills">{job.skills.map(s=><span key={s}>{s}</span>)}</div></>}
          <div className="ad">Advertisement</div>
          <p className="source">Source: {job.source}. Always verify compensation, eligibility, location and other details on the original application website.</p>
        </article>
        <aside><h3>Interested in this role?</h3><p>You will be redirected to the original employer or ATS application source.</p><a className="apply" href={`/go/${job.id}`} rel="nofollow">Apply on official source ↗</a><small>No JobPulse account required.</small></aside>
      </div>

      {related.length > 0 && <section className="related"><div className="sectionHead"><div><h2>Related jobs</h2><p>More opportunities you may want to explore.</p></div></div><div className="grid">{related.map(item => <a className="card" key={item.id} href={`/jobs/${item.slug}`}><span className="fresh">{item.countryCode || 'GLOBAL'} · {item.workMode}</span><h3>{item.title}</h3><p>{item.company}</p><div className="meta"><span>📍 {item.location}</span><span>💼 {item.jobType}</span></div></a>)}</div></section>}
    </section>
  </>;
}
