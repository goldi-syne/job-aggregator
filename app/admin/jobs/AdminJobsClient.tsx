'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type JobRow={id:string;title:string;company:string;location:string;source:string;status:string;posted_at:string;apply_url:string};
const inputStyle={padding:12,border:'1px solid #d8dde6',borderRadius:8,width:'100%'} as const;

function parseCsv(text:string){
  const rows:string[][]=[]; let row:string[]=[], cell='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i], n=text[i+1]; if(c==='"'&&q&&n==='"'){cell+='"';i++;} else if(c==='"'){q=!q;} else if(c===','&&!q){row.push(cell);cell='';} else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n')i++; row.push(cell); if(row.some(v=>v.trim()))rows.push(row); row=[];cell=''; } else cell+=c; }
  row.push(cell); if(row.some(v=>v.trim()))rows.push(row); if(rows.length<2)return [];
  const headers=rows[0].map(h=>h.trim().toLowerCase());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}

export default function AdminJobsClient(){
  const router=useRouter(); const [jobs,setJobs]=useState<JobRow[]>([]); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({title:'',company:'',location:'',country:'United States',job_type:'Full time',work_mode:'On-site',experience:'',skills:'',summary:'',source:'Manual',source_url:'',apply_url:'',posted_at:'',expires_at:''});
  async function load(){ const r=await fetch('/api/admin/jobs'); if(r.status===401){router.replace('/admin/login');return;} const d=await r.json(); setJobs(d.jobs||[]); }
  useEffect(()=>{load();},[]);
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setMessage('');const r=await fetch('/api/admin/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({job:form})});const d=await r.json();setLoading(false);setMessage(r.ok?`Published ${d.inserted} job${d.inserted===1?'':'s'}${d.skipped?` (${d.skipped} duplicate skipped)`:''}`:d.error||'Failed');if(r.ok){setForm({...form,title:'',company:'',location:'',experience:'',skills:'',summary:'',source_url:'',apply_url:'',posted_at:'',expires_at:''});load();}}
  async function upload(file:File){setLoading(true);setMessage('');const rows=parseCsv(await file.text());if(!rows.length){setLoading(false);setMessage('CSV has no data rows');return;}const r=await fetch('/api/admin/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jobs:rows})});const d=await r.json();setLoading(false);setMessage(r.ok?`CSV complete: ${d.inserted} added, ${d.skipped} duplicates skipped`:d.error||'Upload failed');if(r.ok)load();}
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});router.replace('/admin/login');router.refresh();}
  return <main className="wrap" style={{maxWidth:1120}}>
    <div className="sectionHead"><div><div className="eyebrow">Admin Panel</div><h1 style={{margin:'6px 0'}}>Manage Jobs</h1><p>Add one job manually or upload up to 500 jobs by CSV.</p></div><button className="buttonSecondary" onClick={logout}>Log out</button></div>
    {message&&<div className="card" style={{marginBottom:20,padding:14}}><strong>{message}</strong></div>}
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(300px,.6fr)',gap:22}}>
      <section className="card"><h2>Manual Add Job</h2><form onSubmit={submit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {(['title','company','location','country','job_type','work_mode','experience','skills','source','source_url','apply_url','posted_at','expires_at'] as const).map(k=><label key={k} style={{fontSize:13,fontWeight:700}}>{k.replaceAll('_',' ')}<input style={inputStyle} type={k.includes('_at')?'date':'text'} required={['title','company','apply_url'].includes(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
        <label style={{gridColumn:'1 / -1',fontSize:13,fontWeight:700}}>summary<textarea style={{...inputStyle,minHeight:100}} value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label>
        <button className="inlineButton" disabled={loading} style={{gridColumn:'1 / -1'}}>{loading?'Saving…':'Publish Job'}</button>
      </form></section>
      <aside><h2>Bulk CSV Upload</h2><p>Required columns: <b>title, company, apply_url</b>. Optional: location, country, job_type, work_mode, experience, skills, summary, source, source_url, posted_at, expires_at.</p><input type="file" accept=".csv,text/csv" disabled={loading} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);}}/><p style={{fontSize:12}}>Duplicates are skipped when the same Apply URL already exists.</p></aside>
    </div>
    <section style={{marginTop:28}}><div className="sectionHead"><h2>Latest Jobs</h2><span>{jobs.length} shown</span></div><div className="list">{jobs.map(j=><div className="jobrow" key={j.id}><div><div className="fresh">{j.source} · {j.status}</div><h2>{j.title}</h2><p>{j.company} · {j.location}</p></div><a className="buttonSecondary" href={j.apply_url} target="_blank" rel="noreferrer">Open source</a></div>)}</div></section>
  </main>;
}
