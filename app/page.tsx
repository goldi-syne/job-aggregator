import { getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default function Home() {
  const jobs = getJobs();

  return <>
    <section className="hero"><span className="eyebrow">Fresh opportunities · Updated daily</span><h1>Find your next job.<br/>Apply at the source.</h1><p>Browse fresh technology jobs across India. No account required.</p><form action="/jobs"><input name="q" placeholder="Job title, skill or company"/><input name="location" placeholder="City or remote"/><button>Search jobs</button></form></section>
    <section className="wrap"><div className="sectionHead"><div><h2>Latest jobs</h2><p>Recently added opportunities</p></div><a href="/jobs">View all →</a></div><div className="grid">{jobs.map(job => <a className="card" key={job.id} href={`/jobs/${job.slug}`}><div className="companyIcon">{job.company[0]}</div><div><span className="fresh">NEW</span><h3>{job.title}</h3><p>{job.company}</p><div className="meta"><span>📍 {job.location}</span><span>💼 {job.experience}</span></div><div className="skills">{job.skills.slice(0,3).map(s=><span key={s}>{s}</span>)}</div></div></a>)}</div></section>
    <section className="ad">Advertisement space</section>
  </>;
}
