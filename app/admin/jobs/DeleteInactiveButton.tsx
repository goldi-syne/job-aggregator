'use client';

import { useState } from 'react';

export default function DeleteInactiveButton() {
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');

  async function deleteInactive(){
    setLoading(true);
    setMessage('Checking inactive jobs…');
    try {
      const current=await fetch('/api/admin/jobs',{cache:'no-store'});
      const currentData=await current.json();
      if(!current.ok){setMessage(currentData.error||'Could not load job count');setLoading(false);return;}
      const count=Number(currentData.stats?.inactive||0);
      if(count===0){setMessage('There are no inactive jobs to delete.');setLoading(false);return;}
      if(!confirm(`Permanently delete all ${count} inactive jobs? This cannot be undone.`)){setMessage('');setLoading(false);return;}
      const r=await fetch('/api/admin/jobs',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({action:'delete_inactive'})});
      const d=await r.json();
      if(!r.ok){setMessage(d.error||'Delete failed');setLoading(false);return;}
      setMessage(`${d.deleted||0} inactive jobs deleted permanently.`);
      setLoading(false);
      window.location.reload();
    } catch {
      setMessage('Delete failed. Please try again.');
      setLoading(false);
    }
  }

  return <div className="wrap" style={{paddingTop:18,paddingBottom:0}}>
    <div className="card" style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
      <div><strong>Inactive job cleanup</strong><div className="muted" style={{marginTop:4}}>Permanently remove every inactive job from the database in one go.</div></div>
      <button type="button" className="dangerButton" disabled={loading} onClick={deleteInactive}>{loading?'Working…':'Delete All Inactive Jobs'}</button>
      {message&&<div style={{width:'100%'}}><strong>{message}</strong></div>}
    </div>
  </div>;
}
