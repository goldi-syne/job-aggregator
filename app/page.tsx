import { formatSalary, getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

const categories = [
  ['Engineering', 'engineering'],
  ['Data', 'data'],
  ['Cybersecurity', 'security'],
  ['Healthcare', 'healthcare'],
  ['Sales', 'sales'],
  ['Product', 'product'],
];

export default async function Home() {
  const jobs = await getJobs();
  const usJobs = await getJobs({ country: 'US' });
  const featured = (usJobs.length ? usJobs : jobs).slice(0, 6);

  return <>
    <section className="hero heroPolished">
      <div className="heroBadge">Fresh jobs · Official application links</div>
      <h1>Find your next role.<br/>Apply at the source.</h1>
      <p>Search current opportunities across the United States and worldwide. No account required, no candidate fees, and every application opens on the original employer or ATS website.</p>
      <form action="/jobs" className="heroSearch">
        <input name="q" placeholder="Job title, skill or company" aria-label="Job title, skill or company"/>
        <input name="location" placeholder="City, state, country or remote" aria-label="Location"/>
        <button>Search jobs</button>
      </form>
      <div className="trustRow">
        <span>✓ {jobs.length}+ active jobs</span>
        <span>✓ Updated regularly</span>
        <span>✓ No JobPulse account required</span>
      </div>
      <div className="quickFilters heroQuickFilters">
        <a href="/jobs?country=US">🇺🇸 US Jobs</a>
        <a href="/jobs?location=New York">New York</a>
        <a href="/jobs?location=California">California</a>
        <a href="/jobs?location=Texas">Texas</a>
        <a href="/jobs?remote=true">Remote</a>
      </div>
    </section>

    <section className="wrap trustPanel">
      <div><strong>Search</strong><span>Filter by role, location and work mode.</span></div>
      <div><strong>Review</strong><span>See the key details before you leave JobPulse.</span></div>
      <div><strong>Apply</strong><span>Continue to the employer's official application page.</span></div>
    </section>

    <section className="wrap">
      <div className="sectionHead"><div><span className="eyebrow">FRESH OPPORTUNITIES</span><h2>Latest US jobs</h2><p>{usJobs.length} active US opportunities currently indexed.</p></div><a href="/jobs?country=US">View all US jobs →</a></div>
      <div className="grid featuredGrid">{featured.map(job => {
        const salary = formatSalary(job);
        return <a className="card jobCard" key={job.id} href={`/jobs/${job.slug}`}>
          <div className="cardTop"><div className="companyIcon">{job.company[0]}</div><span className="fresh">{job.workMode || 'Flexible'}</span></div>
          <h3>{job.title}</h3>
          <p className="companyName">{job.company}</p>
          <div className="meta"><span>📍 {job.location}</span><span>💼 {job.jobType}</span>{salary && <span>💰 {salary}</span>}</div>
          <div className="skills">{job.skills.slice(0,3).map(s=><span key={s}>{s}</span>)}</div>
          <div className="cardCta">View job <span>→</span></div>
        </a>;
      })}</div>
    </section>

    <section className="wrap" style={{paddingTop:0}}>
      <div className="sectionHead"><div><span className="eyebrow">BROWSE FASTER</span><h2>Popular job categories</h2><p>Jump directly into high-interest areas.</p></div></div>
      <div className="categoryGrid">
        {categories.map(([label, query]) => <a key={query} className="categoryCard" href={`/jobs?q=${encodeURIComponent(query)}`}><span>{label}</span><b>Explore roles →</b></a>)}
      </div>
    </section>

    <section className="wrap" style={{paddingTop:12}}>
      <div className="ctaPanel">
        <div><span className="eyebrow">NO SIGN-UP NEEDED</span><h2>Browse jobs and apply directly.</h2><p>JobPulse helps you discover opportunities. The employer handles the actual application.</p></div>
        <a className="inlineButton" href="/jobs">Browse all jobs</a>
      </div>
    </section>
  </>;
}
