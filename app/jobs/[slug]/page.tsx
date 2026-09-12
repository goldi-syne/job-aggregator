import type { Metadata } from 'next';
import { formatSalary, getJob, getRelatedJobs } from '@/lib/jobs';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{slug:string}> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: 'Job not found' };
  const description = `${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ''}. View responsibilities, qualifications, experience and application details.`;
  return {
    title: `${job.title} at ${job.company}`,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title: `${job.title} at ${job.company}`, description, type: 'article' },
  };
}

export default async function JobPage({params}:Props){
  const {slug}=await params;
  const job=await getJob(slug);
  if(!job) notFound();
  const salary = formatSalary(job);
  const related = await getRelatedJobs(job, 4);

  const fullDescription = [
    job.summary,
    ...job.sections.flatMap(section => [section.title, ...section.items]),
    job.description,
  ].filter(Boolean).join('\n');

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org/', '@type': 'JobPosting', title: job.title,
    description: fullDescription, datePosted: job.postedAt,
    employmentType: job.jobType.toUpperCase().replace(/[^A-Z]+/g, '_').replace(/^_|_$/g, ''),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    url: job.sourceUrl || job.applyUrl,
  };
  if (job.expiresAt) structuredData.validThrough = job.expiresAt;
  if (job.experience) structuredData.experienceRequirements = job.experience;
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
          <div className="facts">
            <span>📍 {job.location}</span>
            {job.experience && <span>🎓 {job.experience} experience</span>}
            <span>⏱ {job.jobType}</span>
            {salary && <span>💰 {salary}</span>}
          </div>

          <div className="ad">Advertisement</div>

          <h2>Job description</h2>
          <div className="jobText">{job.summary.split(/\n+/).filter(Boolean).map((paragraph, index)=><p key={index}>{paragraph}</p>)}</div>

          {job.sections.map((section, sectionIndex) => <section className="jobSection" key={`${section.title}-${sectionIndex}`}>
            <h2>{section.title}</h2>
            <ul>{section.items.map((item, itemIndex)=><li key={itemIndex}>{item}</li>)}</ul>
          </section>)}

          {job.description && <section className="jobSection">
            <h2>Additional details</h2>
            <div className="jobText">{job.description.split(/\n+/).filter(Boolean).map((paragraph, index)=><p key={index}>{paragraph}</p>)}</div>
          </section>}

          {job.salaryDescription && <section className="jobSection"><h2>Compensation</h2><p>{job.salaryDescription}</p></section>}

          {job.category && <><h2>Category</h2><p><a href={`/jobs?category=${encodeURIComponent(job.category)}`}>{job.category}</a></p></>}
          {job.skills.length > 0 && <><h2>Skills</h2><div className="skills">{job.skills.map(s=><span key={s}>{s}</span>)}</div></>}
          <div className="ad">Advertisement</div>
          <p className="source">Source: {job.source}. Job details are taken from the public employer/ATS posting. Always verify the latest compensation, eligibility and application requirements on the original source.</p>
        </article>
        <aside><h3>Interested in this role?</h3><p>You will be redirected to the original employer or ATS application source.</p><a className="apply" href={`/go/${job.id}`} rel="nofollow">Apply on official source ↗</a><small>No JobPulse account required.</small></aside>
      </div>

      {related.length > 0 && <section className="related"><div className="sectionHead"><div><h2>Related jobs</h2><p>More opportunities you may want to explore.</p></div></div><div className="grid">{related.map(item => <a className="card" key={item.id} href={`/jobs/${item.slug}`}><span className="fresh">{item.countryCode || 'GLOBAL'} · {item.workMode}</span><h3>{item.title}</h3><p>{item.company}</p><div className="meta"><span>📍 {item.location}</span><span>💼 {item.jobType}</span></div></a>)}</div></section>}
    </section>
  </>;
}
