import { getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
 const p=await searchParams; const q=(p.q||'').toLowerCase(); const loc=(p.location||'').toLowerCase();
 const jobs=getJobs();
 const filtered=jobs.filter(j=>(!q || `${j.title} ${j.company} ${j.skills.join(' ')}`.toLowerCase().includes(q)) && (!loc || j.location.toLowerCase().includes(loc)) && (p.remote!=='true'||j.remote) && (p.experience!=='fresher'||j.experience.toLowerCase().includes('fresher')||j.experience.startsWith('0')));
 return <section className="wrap jobsPage"><h1>Latest Jobs</h1><form className="searchbar"><input name="q" defaultValue={p.q} placeholder="Search jobs or skills"/><input name="location" defaultValue={p.location} placeholder="Location"/><button>Search</button></form><p>{filtered.length} opportunities found</p><div className="list">{filtered.map(j=><a className="jobrow" href={`/jobs/${j.slug}`} key={j.id}><div><h2>{j.title}</h2><p>{j.company} · {j.location}</p><div className="skills">{j.skills.map(s=><span key={s}>{s}</span>)}</div></div><strong>View job →</strong></a>)}</div></section>
}
