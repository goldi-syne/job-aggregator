import { formatSalary, getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

function pageHref(params: Record<string,string|undefined>, page: number) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key,value]) => { if (value && key !== 'page') q.set(key, value); });
  if (page > 1) q.set('page', String(page));
  const query = q.toString();
  return query ? `/jobs?${query}` : '/jobs';
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const p = await searchParams;
  const allJobs = await getJobs({
    q: p.q,
    location: p.location,
    country: p.country,
    state: p.state,
    jobType: p.jobType,
    category: p.category,
    workMode: p.workMode,
    remote: p.remote === 'true',
  });
  const currentPage = Math.max(1, Number.parseInt(p.page || '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(allJobs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const jobs = allJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return <section className="wrap jobsPage">
    <span className="eyebrow">GLOBAL JOB SEARCH</span>
    <h1>{p.country === 'US' ? 'Jobs in the United States' : 'Latest Jobs Worldwide'}</h1>
    <form className="searchbar">
      <input name="q" defaultValue={p.q} placeholder="Job title, company or skill"/>
      <input name="location" defaultValue={p.location} placeholder="City, state or country"/>
      <select name="country" defaultValue={p.country || ''} aria-label="Country">
        <option value="">All countries</option><option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option><option value="IN">India</option><option value="AU">Australia</option>
      </select>
      <select name="jobType" defaultValue={p.jobType || ''} aria-label="Job type">
        <option value="">All job types</option><option value="Full time">Full time</option><option value="Part time">Part time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
      </select>
      <select name="workMode" defaultValue={p.workMode || ''} aria-label="Work mode">
        <option value="">Any work mode</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option>
      </select>
      <button>Search</button>
    </form>

    <div className="quickFilters">
      <a href="/jobs?country=US">🇺🇸 US Jobs</a><a href="/jobs?country=US&location=California">California</a><a href="/jobs?country=US&location=New York">New York</a><a href="/jobs?country=US&location=Texas">Texas</a><a href="/jobs?remote=true">Remote</a><a href="/jobs?jobType=Contract">Contract</a>
    </div>

    <div className="resultsHeader"><p><strong>{allJobs.length}</strong> opportunities found</p>{Object.values(p).some(Boolean) && <a href="/jobs">Clear filters</a>}</div>

    {jobs.length === 0 ? <div className="emptyState"><h2>No matching jobs yet</h2><p>Try a broader keyword or location, or clear your filters. New jobs can be added automatically from supported sources.</p><a className="buttonSecondary" href="/jobs">Browse all jobs</a></div> : <div className="list">{jobs.map(job => {
      const salary = formatSalary(job);
      return <a className="jobrow" href={`/jobs/${job.slug}`} key={job.id}>
        <div>
          <span className="fresh">{job.countryCode || 'GLOBAL'} · {job.workMode || 'Flexible'}</span>
          <h2>{job.title}</h2>
          <p>{job.company} · {job.location}</p>
          <div className="meta"><span>{job.jobType}</span>{job.experience && <span>{job.experience}</span>}{salary && <span>{salary}</span>}</div>
          <div className="skills">{job.skills.slice(0,5).map(s=><span key={s}>{s}</span>)}</div>
        </div>
        <strong>View job →</strong>
      </a>;
    })}</div>}

    {totalPages > 1 && <nav className="pagination" aria-label="Job results pages">
      {safePage > 1 ? <a href={pageHref(p, safePage - 1)}>← Previous</a> : <span/>}
      <span>Page {safePage} of {totalPages}</span>
      {safePage < totalPages ? <a href={pageHref(p, safePage + 1)}>Next →</a> : <span/>}
    </nav>}
  </section>;
}
