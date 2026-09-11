import { getJob } from '@/lib/jobs';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function JobPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const job=getJob(slug); if(!job) notFound();
 return <section className="wrap detail"><a className="back" href="/jobs">← Back to jobs</a><div className="detailGrid"><article><span className="fresh">NEW OPENING</span><h1>{job.title}</h1><h2>{job.company}</h2><div className="facts"><span>📍 {job.location}</span><span>💼 {job.experience}</span><span>⏱ {job.jobType}</span></div><div className="ad">Advertisement space</div><h2>About the role</h2><p>{job.summary}</p><h2>Skills</h2><div className="skills">{job.skills.map(s=><span key={s}>{s}</span>)}</div><div className="ad">Advertisement space</div><p className="source">Source: {job.source}. Verify all details on the employer/application website before applying.</p></article><aside><h3>Interested in this role?</h3><p>You will be redirected to the original application source.</p><a className="apply" href={`/go/${job.id}`}>Apply on official source ↗</a><small>No login required on JobPulse India.</small></aside></div></section>
}
