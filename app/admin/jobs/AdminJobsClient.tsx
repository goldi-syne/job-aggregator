'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type JobRow={id:string;slug:string;title:string;company:string;location:string;country?:string;job_type?:string;work_mode?:string;experience?:string;skills?:string[];summary?:string;source:string;source_url?:string;status:string;posted_at:string;expires_at?:string;apply_url:string};
type Stats={total:number;active:number;inactive:number;expired:number;manual:number;imported:number};
type ImportRun={source:string;started_at:string;finished_at?:string;imported_count:number;error?:string};
type AdminMode='manual'|'bulk'|'social';
const inputStyle={padding:12,border:'1px solid #d8dde6',borderRadius:8,width:'100%',background:'#fff'} as const;
const blank={title:'',company:'',location:'',country:'United States',job_type:'Full time',work_mode:'On-site',experience:'',skills:'',summary:'',source:'Manual:LinkedIn',source_url:'',apply_url:'',posted_at:'',expires_at:'',status:'active'};

function parseCsv(text:string){
  const rows:string[][]=[]; let row:string[]=[], cell='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i], n=text[i+1]; if(c==='"'&&q&&n==='"'){cell+='"';i++;} else if(c==='"'){q=!q;} else if(c===','&&!q){row.push(cell);cell='';} else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n')i++; row.push(cell); if(row.some(v=>v.trim()))rows.push(row); row=[];cell=''; } else cell+=c; }
  row.push(cell); if(row.some(v=>v.trim()))rows.push(row); if(rows.length<2)return [];
  const headers=rows[0].map(h=>h.trim().toLowerCase());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}

function linkedinText(job:JobRow){
  const jobUrl=`https://jobpulse24.com/jobs/${job.slug}`;
  const lines=[
    `🚀 Hiring: ${job.title}`,
    `🏢 Company: ${job.company}`,
    `📍 Location: ${job.location}`,
    job.work_mode?`💼 Work mode: ${job.work_mode}`:'',
    job.job_type?`⏱ Job type: ${job.job_type}`:'',
    job.experience?`🎓 Experience: ${job.experience}`:'',
    '',
    'View the full job details and apply through the official employer source:',
    jobUrl,
    '',
    '#jobs #hiring #careers #jobsearch #JobPulse'
  ];
  return lines.filter((line,index)=>line || (index>0 && lines[index-1]!=='' )).join('\n').replace(/\n{3,}/g,'\n\n');
}

export default function AdminJobsClient(){
  const router=useRouter();
  const [jobs,setJobs]=useState<JobRow[]>([]); const [stats,setStats]=useState<Stats>({total:0,active:0,inactive:0,expired:0,manual:0,imported:0}); const [runs,setRuns]=useState<ImportRun[]>([]);
  const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false); const [mode,setMode]=useState<AdminMode>('manual'); const [form,setForm]=useState(blank); const [editId,setEditId]=useState(''); const [query,setQuery]=useState('');
  const [socialJob,setSocialJob]=useState<JobRow|null>(null); const [socialText,setSocialText]=useState('');
  const [countryFilter,setCountryFilter]=useState(''); const [jobTypeFilter,setJobTypeFilter]=useState(''); const [workModeFilter,setWorkModeFilter]=useState(''); const [statusFilter,setStatusFilter]=useState(''); const [sourceFilter,setSourceFilter]=useState(''); const [dateFrom,setDateFrom]=useState(''); const [dateTo,setDateTo]=useState(''); const [sortBy,setSortBy]=useState('newest');

  async function load(){ const r=await fetch('/api/admin/jobs',{cache:'no-store'}); if(r.status===401){router.replace('/admin/login');return;} const d=await r.json(); setJobs(d.jobs||[]); setStats(d.stats||stats); setRuns(d.importRuns||[]); }
  useEffect(()=>{load();},[]);

  const countries=useMemo(()=>Array.from(new Set(jobs.map(j=>j.country?.trim()).filter(Boolean) as string[])).sort(),[jobs]);
  const jobTypes=useMemo(()=>Array.from(new Set(jobs.map(j=>j.job_type?.trim()).filter(Boolean) as string[])).sort(),[jobs]);
  const workModes=useMemo(()=>Array.from(new Set(jobs.map(j=>j.work_mode?.trim()).filter(Boolean) as string[])).sort(),[jobs]);
  const shown=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const from=dateFrom?new Date(`${dateFrom}T00:00:00`).getTime():null;
    const to=dateTo?new Date(`${dateTo}T23:59:59`).getTime():null;
    const filtered=jobs.filter(j=>{
      const posted=j.posted_at?new Date(j.posted_at).getTime():0;
      const text=`${j.title} ${j.company} ${j.location} ${j.source} ${(j.skills||[]).join(' ')}`.toLowerCase();
      const sourceKind=j.source?.toLowerCase().startsWith('lever:')?'imported':(j.source?.toLowerCase().startsWith('manual')||j.source?.toLowerCase().includes('linkedin'))?'manual':'other';
      return (!q||text.includes(q))
        && (!countryFilter||j.country===countryFilter)
        && (!jobTypeFilter||j.job_type===jobTypeFilter)
        && (!workModeFilter||j.work_mode===workModeFilter)
        && (!statusFilter||j.status===statusFilter)
        && (!sourceFilter||sourceKind===sourceFilter)
        && (from===null||posted>=from)
        && (to===null||posted<=to);
    });
    return [...filtered].sort((a,b)=>{
      if(sortBy==='oldest') return new Date(a.posted_at||0).getTime()-new Date(b.posted_at||0).getTime();
      if(sortBy==='title') return a.title.localeCompare(b.title);
      if(sortBy==='company') return a.company.localeCompare(b.company);
      return new Date(b.posted_at||0).getTime()-new Date(a.posted_at||0).getTime();
    });
  },[jobs,query,countryFilter,jobTypeFilter,workModeFilter,statusFilter,sourceFilter,dateFrom,dateTo,sortBy]);

  function clearFilters(){setQuery('');setCountryFilter('');setJobTypeFilter('');setWorkModeFilter('');setStatusFilter('');setSourceFilter('');setDateFrom('');setDateTo('');setSortBy('newest');}
  function reset(){setForm(blank);setEditId('');setMode('manual');setSocialJob(null);setSocialText('');}
  function edit(j:JobRow){setForm({title:j.title||'',company:j.company||'',location:j.location||'',country:j.country||'',job_type:j.job_type||'Full time',work_mode:j.work_mode||'On-site',experience:j.experience||'',skills:(j.skills||[]).join(', '),summary:j.summary||'',source:j.source||'Manual',source_url:j.source_url||'',apply_url:j.apply_url||'',posted_at:j.posted_at?.slice(0,10)||'',expires_at:j.expires_at?.slice(0,10)||'',status:j.status||'active'});setEditId(j.id);setMode('manual');setSocialJob(null);window.scrollTo({top:0,behavior:'smooth'});}
  function prepareLinkedIn(j:JobRow){setSocialJob(j);setSocialText(linkedinText(j));setMode('social');setEditId('');window.scrollTo({top:0,behavior:'smooth'});}

  async function copySocial(){try { await navigator.clipboard.writeText(socialText); setMessage('LinkedIn post copied. Paste it into LinkedIn.'); } catch { setMessage('Could not copy automatically. Select the text and copy it manually.'); }}
  async function openLinkedIn(){if(!socialJob)return;try { await navigator.clipboard.writeText(socialText); } catch {} const jobUrl=`https://jobpulse24.com/jobs/${socialJob.slug}`;window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`,'_blank','noopener,noreferrer');setMessage('LinkedIn opened. Paste the copied JobPulse post text, then publish.');}
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setMessage('');const method=editId?'PATCH':'POST';const payload=editId?{id:editId,job:form}:{job:form};const r=await fetch('/api/admin/jobs',{method,headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();setLoading(false);setMessage(r.ok?(editId?'Job updated successfully':`Published ${d.inserted} job${d.inserted===1?'':'s'}${d.skipped?` (${d.skipped} duplicate skipped)`:''}`):d.error||'Failed');if(r.ok){reset();load();}}
  async function upload(file:File){setLoading(true);setMessage('');const rows=parseCsv(await file.text());if(!rows.length){setLoading(false);setMessage('CSV has no data rows');return;}const r=await fetch('/api/admin/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jobs:rows})});const d=await r.json();setLoading(false);setMessage(r.ok?`CSV complete: ${d.inserted} added, ${d.skipped} duplicates skipped`:d.error||'Upload failed');if(r.ok)load();}
  async function action(id:string,action:'activate'|'deactivate'){setLoading(true);const r=await fetch('/api/admin/jobs',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,action})});const d=await r.json();setLoading(false);setMessage(r.ok?`Job ${action}d`:d.error||'Action failed');if(r.ok)load();}
  async function remove(id:string){if(!confirm('Delete this job permanently?'))return;setLoading(true);const r=await fetch('/api/admin/jobs',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id})});const d=await r.json();setLoading(false);setMessage(r.ok?'Job deleted':d.error||'Delete failed');if(r.ok)load();}
  async function runImport(){setLoading(true);setMessage('Running ATS import…');const r=await fetch('/api/admin/import-jobs',{method:'POST'});const d=await r.json();setLoading(false);setMessage(r.ok?`Import finished: ${d.newCount||0} new · ${d.updatedCount||0} updated · ${d.deactivatedCount||0} deactivated · ${d.successCount||0}/${d.sourceCount||0} sources successful${d.failureCount?` · ${d.failureCount} failed`:''}`:d.error||'Import failed');if(r.ok)load();}
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});router.replace('/admin/login');router.refresh();}

  return <main className="wrap adminWrap">
    <div className="sectionHead"><div><div className="eyebrow">Admin Panel</div><h1 style={{margin:'6px 0'}}>Soft Launch Dashboard</h1><p>Manage jobs and prepare LinkedIn posts from one place.</p></div><button className="buttonSecondary" onClick={logout}>Log out</button></div>
    <div className="adminStats">{Object.entries(stats).map(([k,v])=><div className="statCard" key={k}><strong>{v}</strong><span>{k}</span></div>)}</div>
    <div className="adminTabs"><button type="button" onClick={()=>{setMode('manual');if(!editId)reset();}} className={mode==='manual'?'inlineButton':'buttonSecondary'}>+ Manual Add Job</button><button type="button" onClick={()=>{setMode('bulk');setSocialJob(null);}} className={mode==='bulk'?'inlineButton':'buttonSecondary'}>Bulk CSV Upload</button><button type="button" onClick={runImport} className="buttonSecondary" disabled={loading}>↻ Import ATS Jobs Now</button></div>
    {message&&<div className="notice"><strong>{message}</strong></div>}

    {mode==='manual' && <section className="card adminFormCard"><div className="sectionHead"><div><h2 style={{marginTop:0}}>{editId?'Edit Job':'Manual Add Job'}</h2><p>{editId?'Update the selected listing.':'Use LinkedIn for discovery, but prefer the employer/ATS URL for Apply.'}</p></div>{editId&&<button type="button" className="buttonSecondary" onClick={reset}>Cancel edit</button>}</div><form onSubmit={submit} className="adminForm">
      {(['title','company','location','country','job_type','work_mode','experience','skills','source','source_url','apply_url','posted_at','expires_at'] as const).map(k=><label key={k}>{k.replaceAll('_',' ')}<input style={inputStyle} type={k.includes('_at')?'date':k.includes('url')?'url':'text'} required={['title','company','apply_url'].includes(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
      <label>status<select style={inputStyle} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <label className="full">summary<textarea style={{...inputStyle,minHeight:120,resize:'vertical'}} value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label>
      <button className="inlineButton full" disabled={loading}>{loading?'Saving…':editId?'Save Changes':'Publish Job'}</button>
    </form></section>}

    {mode==='bulk' && <section className="card adminFormCard"><h2 style={{marginTop:0}}>Bulk CSV Upload</h2><p>Upload up to 500 jobs. Required: <b>title, company, apply_url</b>. Recommended: location, country, job_type, work_mode, skills, summary, source, source_url, posted_at, expires_at.</p><input type="file" accept=".csv,text/csv" disabled={loading} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);}}/><p className="muted">Duplicate Apply URLs are skipped automatically.</p></section>}

    {mode==='social' && socialJob && <section className="card adminFormCard"><div className="sectionHead"><div><div className="eyebrow">LinkedIn Post</div><h2 style={{margin:'6px 0'}}>{socialJob.title}</h2><p>{socialJob.company} · {socialJob.location}</p></div><button type="button" className="buttonSecondary" onClick={()=>setMode('manual')}>Close</button></div><p className="muted">Edit the text if you want. The link goes to JobPulse, and JobPulse sends the candidate to the official employer/ATS source.</p><textarea style={{...inputStyle,minHeight:260,resize:'vertical',lineHeight:1.55}} value={socialText} onChange={e=>setSocialText(e.target.value)}/><div className="adminActions" style={{marginTop:14,justifyContent:'flex-start'}}><button type="button" className="inlineButton" onClick={copySocial}>Copy post</button><button type="button" className="buttonSecondary" onClick={openLinkedIn}>Open LinkedIn ↗</button><a className="buttonSecondary" href={`/jobs/${socialJob.slug}`} target="_blank" rel="noreferrer">Preview JobPulse page ↗</a></div><p className="muted" style={{marginTop:12}}>LinkedIn does not reliably allow external tools to prefill all post text without approved API access, so JobPulse copies the post and opens LinkedIn for you.</p></section>}

    <section style={{marginTop:30}}>
      <div className="sectionHead"><div><h2>Manage Jobs</h2><p>Filter, edit, deactivate, delete or prepare LinkedIn posts.</p></div><strong>{shown.length} shown</strong></div>
      <div className="card" style={{marginBottom:18}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
          <input style={inputStyle} placeholder="Search title, company, location, skill" value={query} onChange={e=>setQuery(e.target.value)}/>
          <select style={inputStyle} value={countryFilter} onChange={e=>setCountryFilter(e.target.value)}><option value="">All countries</option>{countries.map(v=><option key={v} value={v}>{v}</option>)}</select>
          <select style={inputStyle} value={jobTypeFilter} onChange={e=>setJobTypeFilter(e.target.value)}><option value="">All job types</option>{jobTypes.map(v=><option key={v} value={v}>{v}</option>)}</select>
          <select style={inputStyle} value={workModeFilter} onChange={e=>setWorkModeFilter(e.target.value)}><option value="">All work modes</option>{workModes.map(v=><option key={v} value={v}>{v}</option>)}</select>
          <select style={inputStyle} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <select style={inputStyle} value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option value="">All sources</option><option value="imported">ATS imported</option><option value="manual">Manual / LinkedIn discovery</option><option value="other">Other</option></select>
          <label style={{fontSize:12,fontWeight:700}}>Posted from<input style={inputStyle} type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label>
          <label style={{fontSize:12,fontWeight:700}}>Posted to<input style={inputStyle} type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label>
          <select style={inputStyle} value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Job title A-Z</option><option value="company">Company A-Z</option></select>
          <button type="button" className="buttonSecondary" onClick={clearFilters}>Clear filters</button>
        </div>
      </div>
      <div className="list">{shown.length?shown.map(j=><div className="jobrow adminJobRow" key={j.id}><div><div className="fresh">{j.source} · {j.status}</div><h2>{j.title}</h2><p>{j.company} · {j.location}</p><div className="meta"><span>{j.country||'Country not set'}</span><span>{j.job_type||'Job type not set'}</span><span>{j.work_mode||'Work mode not set'}</span><span>Posted {j.posted_at?new Date(j.posted_at).toLocaleDateString():'—'}</span></div></div><div className="adminActions"><button className="inlineButton" onClick={()=>prepareLinkedIn(j)} disabled={j.status!=='active'}>LinkedIn Post</button><a className="buttonSecondary" href={`/jobs/${j.slug}`} target="_blank" rel="noreferrer">View</a><button className="buttonSecondary" onClick={()=>edit(j)}>Edit</button><button className="buttonSecondary" onClick={()=>action(j.id,j.status==='active'?'deactivate':'activate')}>{j.status==='active'?'Deactivate':'Activate'}</button><button className="dangerButton" onClick={()=>remove(j.id)}>Delete</button></div></div>):<div className="emptyState"><h2>No jobs match these filters</h2><p>Clear one or more filters and try again.</p><button className="buttonSecondary" onClick={clearFilters}>Clear filters</button></div>}</div>
    </section>

    <section style={{marginTop:34}}><div className="sectionHead"><div><h2>Automatic Import Status</h2><p>Recent ATS import runs. Vercel also runs the importer daily.</p></div><button type="button" onClick={runImport} className="buttonSecondary" disabled={loading}>Run import now</button></div><div className="list">{runs.length?runs.map((r,i)=><div className="jobrow" key={`${r.source}-${r.started_at}-${i}`}><div><div className="fresh">{r.error?'FAILED':'IMPORT'}</div><h2>{r.source}</h2><p>{new Date(r.started_at).toLocaleString()} · {r.imported_count||0} processed{r.error?` · ${r.error}`:''}</p></div></div>):<div className="emptyState"><h2>No import runs yet</h2><p>The scheduled import has not fired yet. You can use “Import ATS Jobs Now” above to run it immediately.</p></div>}</div></section>
  </main>;
}
