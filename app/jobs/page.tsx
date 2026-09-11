import { formatSalary, getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const p = await searchParams;
  const jobs = getJobs({
    q: p.q,
    location: p.location,
    country: p.country,
    state: p.state,
    jobType: p.jobType,
    remote: p.remote === 'true',
  });

  return <section className="wrap jobsPage">
    <span className="eyebrow">GLOBAL JOB SEARCH</span>
    <h1>{p.country === 'US' ? 'Jobs in the United States' : 'Latest Jobs Worldwide'}</h1>
    <form className="searchbar">
      <input name="q" defaultValue={p.q} placeholder="Job title, company or skill"/>
      <input name="location" defaultValue={p.location} placeholder="City, state or country"/>
      <select name="country" defaultValue={p.country || ''} aria-label="Country">
        <option value="">All countries</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="GB">United Kingdom</option>
        <option value="IN">India</option>
        <option value="AU">Australia</option>
      </select>
      <select name="jobType" defaultValue={p.jobType || ''} aria-label="Job type">
        <option value="">All job types</option>
        <option value="Full time">Full time</option>
        <option value="Part time">Part time</option>
        <option value="Contract">Contract</option>
        <option value="Internship">Internship</option>
      </select>
      <button>Search</button>
    </form>

    <div className="skills" style={{margin:'18px 0 8px'}}>
      <a href="/jobs?country=US"><span>🇺🇸 US</span></a>
      <a href="/jobs?country=US&location=California"><span>California</span></a>
      <a href="/jobs?country=US&location=New York"><span>New York</span></a>
      <a href="/jobs?country=US&location=Texas"><span>Texas</span></a>
      <a href="/jobs?remote=true"><span>Remote</span></a>
    </div>

    <p>{jobs.length} opportunities found</p>
    <div className="list">{jobs.map(job => {
      const salary = formatSalary(job);
      return <a className="jobrow" href={`/jobs/${job.slug}`} key={job.id}>
        <div>
          <span className="fresh">{job.countryCode} · {job.workMode}</span>
          <h2>{job.title}</h2>
          <p>{job.company} · {job.location}</p>
          <div className="meta"><span>{job.jobType}</span>{job.experience && <span>{job.experience}</span>}{salary && <span>{salary}</span>}</div>
          <div className="skills">{job.skills.slice(0,5).map(s=><span key={s}>{s}</span>)}</div>
        </div>
        <strong>View job →</strong>
      </a>;
    })}</div>
  </section>;
}
