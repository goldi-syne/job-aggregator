import { formatSalary, getJob } from '@/lib/jobs';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function JobPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const job=getJob(slug);
  if(!job) notFound();
  const salary = formatSalary(job);

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.summary,
    datePosted: job.postedAt,
    employmentType: job.jobType.toUpperCase().replace(/ /g, '_'),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    url: job.sourceUrl || job.applyUrl,
  };

  if (job.expiresAt) structuredData.validThrough = job.expiresAt;
  if (job.remote) {
    structuredData.jobLocationType = 'TELECOMMUTE';
    structuredData.applicantLocationRequirements = { '@type': 'Country', name: job.country };
  } else {
    structuredData.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city || undefined,
        addressRegion: job.state || undefined,
        addressCountry: job.countryCode,
      }
    };
  }
  if (job.salaryMin || job.salaryMax) {
    structuredData.baseSalary = {
      '@type': 'MonetaryAmount', currency: job.salaryCurrency,
      value: { '@type': 'QuantitativeValue', minValue: job.salaryMin, maxValue: job.salaryMax, unitText: 'YEAR' }
    };
  }

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
    <section className="wrap detail">
      <a className="back" href="/jobs">← Back to jobs</a>
      <div className="detailGrid">
        <article>
          <span className="fresh">{job.countryCode} · {job.workMode}</span>
          <h1>{job.title}</h1><h2>{job.company}</h2>
          <div className="facts"><span>📍 {job.location}</span><span>💼 {job.experience || job.jobType}</span><span>⏱ {job.jobType}</span>{salary && <span>💰 {salary}</span>}</div>
          <div className="ad">Advertisement space</div>
          <h2>About the role</h2><p>{job.summary}</p>
          {job.category && <><h2>Category</h2><p>{job.category}</p></>}
          <h2>Skills</h2><div className="skills">{job.skills.map(s=><span key={s}>{s}</span>)}</div>
          <div className="ad">Advertisement space</div>
          <p className="source">Source: {job.source}. Always verify compensation, eligibility, location and other details on the original application website.</p>
        </article>
        <aside><h3>Interested in this role?</h3><p>You will be redirected to the original employer or ATS application source.</p><a className="apply" href={`/go/${job.id}`}>Apply on official source ↗</a><small>No JobPulse account required.</small></aside>
      </div>
    </section>
  </>;
}
