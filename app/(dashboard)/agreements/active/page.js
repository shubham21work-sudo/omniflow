'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function ActiveAgreementsPage() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAgreements(); }, []);

  const fetchAgreements = async () => {
    const { data } = await supabase.from('agreements').select('*').order('created_at', { ascending: false });
    setAgreements(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this agreement?')) return;
    await supabase.from('agreements').delete().eq('id', id);
    setAgreements(p => p.filter(a => a.id !== id));
  };

  const isActive = (a) => {
    const today = new Date();
    return new Date(a.start_date) <= today && new Date(a.end_date) >= today;
  };

  const shown = agreements.filter(a => filter==='all' ? true : filter==='active' ? isActive(a) : !isActive(a));
  const activeCount = agreements.filter(isActive).length;

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Active Agreements</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>All uploaded vendor agreements</p>
      </div>

      <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
        {[['all','All ('+agreements.length+')'],['active','Active ('+activeCount+')'],['expired','Expired ('+(agreements.length-activeCount)+')']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:'8px 16px',borderRadius:'10px',border:'1px solid '+(filter===k?'#7c3aed':'#e2e8f0'),background:filter===k?'#ede9fe':'white',color:filter===k?'#7c3aed':'#475569',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>{l}</button>
        ))}
      </div>

      {loading && <p style={{color:'#94a3b8',fontSize:'14px',textAlign:'center',padding:'40px'}}>Loading...</p>}
      {!loading && shown.length===0 && (
        <div style={{background:'white',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <p style={{color:'#94a3b8',fontSize:'14px'}}>No agreements here.</p>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'14px'}}>
        {shown.map(a=>(
          <div key={a.id} style={{background:'white',borderRadius:'14px',padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
              <div>
                <p style={{fontSize:'14px',fontWeight:'700',color:'#0f172a',margin:0}}>{a.agreement_number}</p>
                <p style={{fontSize:'13px',color:'#64748b',margin:'3px 0 0'}}>{a.vendor_name||'No vendor'}</p>
              </div>
              <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:isActive(a)?'#dcfce7':'#fee2e2',color:isActive(a)?'#16a34a':'#dc2626',flexShrink:0,marginLeft:'8px'}}>
                {isActive(a)?'Active':'Expired'}
              </span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px',background:'#f8fafc',borderRadius:'8px',padding:'10px'}}>
              {[['From', a.start_date||'-'],['To', a.end_date||'-'],['Monthly Value','Rs. '+(a.monthly_value||0).toLocaleString()],['GST',a.gst_number||'-']].map(([k,v])=>(
                <div key={k}>
                  <p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p>
                  <p style={{fontSize:'12px',fontWeight:'700',color:'#334155',margin:'2px 0 0'}}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              {a.agreement_file_url ? (
                <a href={a.agreement_file_url} target='_blank' rel='noopener noreferrer' style={{flex:1,padding:'8px',borderRadius:'8px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'12px',fontWeight:'600',textAlign:'center',textDecoration:'none'}}>Download File</a>
              ) : (
                <span style={{flex:1,padding:'8px',borderRadius:'8px',background:'#f1f5f9',color:'#94a3b8',fontSize:'12px',fontWeight:'600',textAlign:'center'}}>No file attached</span>
              )}
              <button onClick={()=>handleDelete(a.id)} style={{padding:'8px 14px',borderRadius:'8px',background:'#fee2e2',color:'#dc2626',fontSize:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}