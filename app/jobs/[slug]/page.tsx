import type { Metadata } from 'next';
import { formatSalary, getJob, getRelatedJobs } from '@/lib/jobs';
import { absoluteUrl } from '@/lib/site';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{slug:string}> };

function schemaEmploymentType(jobType: string): string | string[] {
  const value = jobType.toLowerCase();
  const types: string[] = [];
  if (value.includes('full') && value.includes('time')) types.push('FULL_TIME');
  if (value.includes('part') && value.includes('time')) types.push('PART_TIME');
  if (value.includes('contract')) types.push('CONTRACTOR');
  if (value.includes('temporary') || value.includes('temp')) types.push('TEMPORARY');
  if (value.includes('intern')) types.push('INTERN');
  if (value.includes('volunteer')) types.push('VOLUNTEER');
  if (value.includes('per diem')) types.push('PER_DIEM');
  if (types.length === 0) return 'OTHER';
  return types.length === 1 ? types[0] : types;
}

function formatPostedDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
  const canonicalUrl = absoluteUrl(`/jobs/${job.slug}`);
  const postedDate = formatPostedDate(job.postedAt);
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${job.title} at ${job.company} ${canonicalUrl}`)}`;

  const fullDescription = [
    job.summary,
    ...job.sections.flatMap(section => [section.title, ...section.items]),
    job.description,
  ].filter(Boolean).join('\n');

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: fullDescription,
    datePosted: job.postedAt,
    employmentType: schemaEmploymentType(job.jobType),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    url: canonicalUrl,
    directApply: false,
  };
  if (job.expiresAt) structuredData.validThrough = job.expiresAt;
  if (job.experience) structuredData.experienceRequirements = job.experience;
  if (job.remote) {
    structuredData.jobLocationType = 'TELECOMMUTE';
    if (job.country) structuredData.applicantLocationRequirements = { '@type': 'Country', name: job.country };
    else if (job.countryCode) structuredData.applicantLocationRequirements = { '@type': 'Country', name: job.countryCode };
  } else {
    structuredData.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city || undefined,
        addressRegion: job.state || undefined,
        addressCountry: job.countryCode || undefined,
      },
    };
  }
  const jsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
    <section className="wrap detail">
      <a className="back" href="/jobs">← Back to jobs</a>
      <div className="detailGrid">
        <article>
          <div className="jobHeroBlock">
            <span className="fresh">{job.countryCode || 'GLOBAL'} · {job.workMode || 'Flexible'}</span>
            <h1>{job.title}</h1>
            <h2 className="detailCompany">{job.company}</h2>
            <div className="factGrid">
              <div><small>Location</small><strong>{job.location || 'Not specified'}</strong></div>
              <div><small>Work mode</small><strong>{job.workMode || (job.remote ? 'Remote' : 'Flexible')}</strong></div>
              <div><small>Job type</small><strong>{job.jobType || 'Not specified'}</strong></div>
              <div><small>Posted</small><strong>{postedDate || 'Recently'}</strong></div>
              {job.experience && <div><small>Experience</small><strong>{job.experience}</strong></div>}
              {salary && <div><small>Compensation</small><strong>{salary}</strong></div>}
            </div>
            <div className="shareRow"><span>Share this job</span><a href={linkedInShare} target="_blank" rel="noopener noreferrer nofollow">LinkedIn</a><a href={whatsappShare} target="_blank" rel="noopener noreferrer nofollow">WhatsApp</a></div>
          </div>

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

          {job.category && <><h2>Category</h2><p><a className="textLink" href={`/jobs?category=${encodeURIComponent(job.category)}`}>{job.category}</a></p></>}
          {job.skills.length > 0 && <><h2>Skills</h2><div className="skills">{job.skills.map(s=><span key={s}>{s}</span>)}</div></>}

          <div className="endApplyPanel">
            <div><strong>Ready to apply?</strong><p>Continue on the official employer or ATS application page.</p></div>
            <a className="apply" href={`/go/${job.id}`} rel="nofollow">Apply on official source ↗</a>
          </div>

          <p className="source">Source: {job.source}. Job details are taken from the public employer/ATS posting. Always verify the latest compensation, eligibility and application requirements on the original source.</p>
        </article>
        <aside className="applyAside"><span className="eyebrow">OFFICIAL APPLICATION</span><h3>Interested in this role?</h3><p>You will be redirected to the original employer or ATS application source.</p><a className="apply" href={`/go/${job.id}`} rel="nofollow">Apply on official source ↗</a><small>No JobPulse account required. We never charge candidates to apply.</small></aside>
      </div>

      {related.length > 0 && <section className="related"><div className="sectionHead"><div><span className="eyebrow">KEEP EXPLORING</span><h2>Related jobs</h2><p>More opportunities you may want to explore.</p></div></div><div className="grid">{related.map(item => <a className="card jobCard" key={item.id} href={`/jobs/${item.slug}`}><span className="fresh">{item.countryCode || 'GLOBAL'} · {item.workMode}</span><h3>{item.title}</h3><p>{item.company}</p><div className="meta"><span>📍 {item.location}</span><span>💼 {item.jobType}</span></div><div className="cardCta">View job <span>→</span></div></a>)}</div></section>}
    </section>
    <div className="mobileApplyBar"><span>{job.title}</span><a href={`/go/${job.id}`} rel="nofollow">Apply now ↗</a></div>
  </>;
}
