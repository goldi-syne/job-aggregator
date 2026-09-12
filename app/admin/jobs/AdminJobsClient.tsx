'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type JobRow={id:string;title:string;company:string;location:string;country?:string;job_type?:string;work_mode?:string;experience?:string;skills?:string[];summary?:string;source:string;source_url?:string;status:string;posted_at:string;expires_at?:string;apply_url:string};
type Stats={total:number;active:number;inactive:number;expired:number;manual:number;imported:number};
type ImportRun={source:string;started_at:string;finished_at?:string;imported_count:number;error?:string};
type AdminMode='manual'|'bulk';
const inputStyle={padding:12,border:'1px solid #d8dde6',borderRadius:8,width:'100%',background:'#fff'} as const;
const blank={title:'',company:'',location:'',country:'United States',job_type:'Full time',work_mode:'On-site',experience:'',skills:'',summary:'',source:'Manual:LinkedIn',source_url:'',apply_url:'',posted_at:'',expires_at:'',status:'active'};

function parseCsv(text:string){
  const rows:string[][]=[]; let row:string[]=[], cell='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i], n=text[i+1]; if(c==='"'&&q&&n==='"'){cell+='"';i++;} else if(c==='"'){q=!q;} else if(c===','&&!q){row.push(cell);cell='';} else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n')i++; row.push(cell); if(row.some(v=>v.trim()))rows.push(row); row=[];cell=''; } else cell+=c; }
  row.push(cell); if(row.some(v=>v.trim()))rows.push(row); if(rows.length<2)return [];
  const headers=rows[0].map(h=>h.trim().toLowerCase());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}

export default function AdminJobsClient(){
  const router=useRouter();
  const [jobs,setJobs]=useState<JobRow[]>([]); const [stats,setStats]=useState<Stats>({total:0,active:0,inactive:0,expired:0,manual:0,imported:0}); const [runs,setRuns]=useState<ImportRun[]>([]);
  const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false); const [mode,setMode]=useState<AdminMode>('manual'); const [form,setForm]=useState(blank); const [editId,setEditId]=useState(''); const [query,setQuery]=useState('');

  async function load(){ const r=await fetch('/api/admin/jobs',{cache:'no-store'}); if(r.status===401){router.replace('/admin/login');return;} const d=await r.json(); setJobs(d.jobs||[]); setStats(d.stats||stats); setRuns(d.importRuns||[]); }
  useEffect(()=>{load();},[]);
  const shown=useMemo(()=>jobs.filter(j=>`${j.title} ${j.company} ${j.location} ${j.source}`.toLowerCase().includes(query.toLowerCase())),[jobs,query]);

  function reset(){setForm(blank);setEditId('');setMode('manual');}
  function edit(j:JobRow){setForm({title:j.title||'',company:j.company||'',location:j.location||'',country:j.country||'',job_type:j.job_type||'Full time',work_mode:j.work_mode||'On-site',experience:j.experience||'',skills:(j.skills||[]).join(', '),summary:j.summary||'',source:j.source||'Manual',source_url:j.source_url||'',apply_url:j.apply_url||'',posted_at:j.posted_at?.slice(0,10)||'',expires_at:j.expires_at?.slice(0,10)||'',status:j.status||'active'});setEditId(j.id);setMode('manual');window.scrollTo({top:0,behavior:'smooth'});}

  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setMessage('');const method=editId?'PATCH':'POST';const payload=editId?{id:editId,job:form}:{job:form};const r=await fetch('/api/admin/jobs',{method,headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();setLoading(false);setMessage(r.ok?(editId?'Job updated successfully':`Published ${d.inserted} job${d.inserted===1?'':'s'}${d.skipped?` (${d.skipped} duplicate skipped)`:''}`):d.error||'Failed');if(r.ok){reset();load();}}
  async function upload(file:File){setLoading(true);setMessage('');const rows=parseCsv(await file.text());if(!rows.length){setLoading(false);setMessage('CSV has no data rows');return;}const r=await fetch('/api/admin/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jobs:rows})});const d=await r.json();setLoading(false);setMessage(r.ok?`CSV complete: ${d.inserted} added, ${d.skipped} duplicates skipped`:d.error||'Upload failed');if(r.ok)load();}
  async function action(id:string,action:'activate'|'deactivate'){setLoading(true);const r=await fetch('/api/admin/jobs',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,action})});const d=await r.json();setLoading(false);setMessage(r.ok?`Job ${action}d`:d.error||'Action failed');if(r.ok)load();}
  async function remove(id:string){if(!confirm('Delete this job permanently?'))return;setLoading(true);const r=await fetch('/api/admin/jobs',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id})});const d=await r.json();setLoading(false);setMessage(r.ok?'Job deleted':d.error||'Delete failed');if(r.ok)load();}
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});router.replace('/admin/login');router.refresh();}

  return <main className="wrap adminWrap">
    <div className="sectionHead"><div><div className="eyebrow">Admin Panel</div><h1 style={{margin:'6px 0'}}>Soft Launch Dashboard</h1><p>Manage manual, CSV and automated jobs in one place.</p></div><button className="buttonSecondary" onClick={logout}>Log out</button></div>
    <div className="adminStats">{Object.entries(stats).map(([k,v])=><div className="statCard" key={k}><strong>{v}</strong><span>{k}</span></div>)}</div>
    <div className="adminTabs"><button type="button" onClick={()=>{setMode('manual');if(!editId)reset();}} className={mode==='manual'?'inlineButton':'buttonSecondary'}>+ Manual Add Job</button><button type="button" onClick={()=>setMode('bulk')} className={mode==='bulk'?'inlineButton':'buttonSecondary'}>Bulk CSV Upload</button></div>
    {message&&<div className="notice"><strong>{message}</strong></div>}

    {mode==='manual' && <section className="card adminFormCard"><div className="sectionHead"><div><h2 style={{marginTop:0}}>{editId?'Edit Job':'Manual Add Job'}</h2><p>{editId?'Update the selected listing.':'Use LinkedIn for discovery, but prefer the employer/ATS URL for Apply.'}</p></div>{editId&&<button type="button" className="buttonSecondary" onClick={reset}>Cancel edit</button>}</div><form onSubmit={submit} className="adminForm">
      {(['title','company','location','country','job_type','work_mode','experience','skills','source','source_url','apply_url','posted_at','expires_at'] as const).map(k=><label key={k}>{k.replaceAll('_',' ')}<input style={inputStyle} type={k.includes('_at')?'date':k.includes('url')?'url':'text'} required={['title','company','apply_url'].includes(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
      <label>status<select style={inputStyle} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <label className="full">summary<textarea style={{...inputStyle,minHeight:120,resize:'vertical'}} value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label>
      <button className="inlineButton full" disabled={loading}>{loading?'Saving…':editId?'Save Changes':'Publish Job'}</button>
    </form></section>}

    {mode==='bulk' && <section className="card adminFormCard"><h2 style={{marginTop:0}}>Bulk CSV Upload</h2><p>Upload up to 500 jobs. Required: <b>title, company, apply_url</b>. Recommended: location, country, job_type, work_mode, skills, summary, source, source_url, posted_at, expires_at.</p><input type="file" accept=".csv,text/csv" disabled={loading} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);}}/><p className="muted">Duplicate Apply URLs are skipped automatically.</p></section>}

    <section style={{marginTop:30}}><div className="sectionHead"><div><h2>Manage Jobs</h2><p>Edit, deactivate or remove bad and expired listings.</p></div><input style={{...inputStyle,maxWidth:320}} placeholder="Search admin jobs" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="list">{shown.map(j=><div className="jobrow adminJobRow" key={j.id}><div><div className="fresh">{j.source} · {j.status}</div><h2>{j.title}</h2><p>{j.company} · {j.location}</p></div><div className="adminActions"><button className="buttonSecondary" onClick={()=>edit(j)}>Edit</button><button className="buttonSecondary" onClick={()=>action(j.id,j.status==='active'?'deactivate':'activate')}>{j.status==='active'?'Deactivate':'Activate'}</button><button className="dangerButton" onClick={()=>remove(j.id)}>Delete</button></div></div>)}</div></section>

    <section style={{marginTop:34}}><div className="sectionHead"><div><h2>Automatic Import Status</h2><p>Recent ATS import runs.</p></div></div><div className="list">{runs.length?runs.map((r,i)=><div className="jobrow" key={`${r.source}-${r.started_at}-${i}`}><div><div className="fresh">{r.error?'FAILED':'IMPORT'}</div><h2>{r.source}</h2><p>{new Date(r.started_at).toLocaleString()} · {r.imported_count||0} imported{r.error?` · ${r.error}`:''}</p></div></div>):<div className="emptyState"><h2>No import runs yet</h2><p>The automated importer has not recorded a run yet.</p></div>}</div></section>
  </main>;
}
