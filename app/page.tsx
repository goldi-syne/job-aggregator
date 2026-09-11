import { formatSalary, getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default function Home() {
  const jobs = getJobs();
  const usJobs = getJobs({ country: 'US' });

  return <>
    <section className="hero">
      <span className="eyebrow">United States first · Worldwide coverage</span>
      <h1>Find jobs in the US<br/>and around the world.</h1>
      <p>Search fresh opportunities and apply directly on the original employer or ATS website. No JobPulse account required.</p>
      <form action="/jobs">
        <input name="q" placeholder="Job title, skill or company"/>
        <input name="location" placeholder="City, state, country or remote"/>
        <button>Search jobs</button>
      </form>
      <div className="skills" style={{justifyContent:'center',marginTop:18}}>
        <a href="/jobs?country=US"><span>🇺🇸 US Jobs</span></a>
        <a href="/jobs?location=New York"><span>New York</span></a>
        <a href="/jobs?location=California"><span>California</span></a>
        <a href="/jobs?location=Texas"><span>Texas</span></a>
        <a href="/jobs?remote=true"><span>Remote</span></a>
      </div>
    </section>

    <section className="wrap">
      <div className="sectionHead"><div><h2>Latest US jobs</h2><p>{usJobs.length} US opportunities currently indexed</p></div><a href="/jobs?country=US">View US jobs →</a></div>
      <div className="grid">{(usJobs.length ? usJobs : jobs).slice(0,6).map(job => {
        const salary = formatSalary(job);
        return <a className="card" key={job.id} href={`/jobs/${job.slug}`}>
          <div className="companyIcon">{job.company[0]}</div>
          <div><span className="fresh">{job.workMode.toUpperCase()}</span><h3>{job.title}</h3><p>{job.company}</p>
          <div className="meta"><span>📍 {job.location}</span><span>💼 {job.experience || job.jobType}</span>{salary && <span>💰 {salary}</span>}</div>
          <div className="skills">{job.skills.slice(0,3).map(s=><span key={s}>{s}</span>)}</div></div>
        </a>;
      })}</div>
    </section>

    <section className="wrap" style={{paddingTop:0}}>
      <div className="sectionHead"><div><h2>Explore worldwide</h2><p>Our data model supports jobs from any country and currency.</p></div><a href="/jobs">All jobs →</a></div>
      <div className="grid">
        <a className="card" href="/jobs?country=US"><h3>United States</h3><p>Our primary market: states, cities, remote and hybrid roles.</p></a>
        <a className="card" href="/jobs?remote=true"><h3>Remote worldwide</h3><p>Find jobs that can be performed away from an office.</p></a>
        <a className="card" href="/jobs"><h3>All countries</h3><p>Browse every active opportunity currently indexed.</p></a>
      </div>
    </section>
    <section className="ad">Advertisement space</section>
  </>;
}
