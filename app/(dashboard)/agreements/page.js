'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AgreementsPage() {
  const [form, setForm] = useState({ vendor_name:'', agreement_number:'', start_date:'', end_date:'', monthly_value:'', branches:'', scope:'' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from('agreements').insert([{ agreement_number: form.agreement_number, start_date: form.start_date, end_date: form.end_date, monthly_value: parseFloat(form.monthly_value), branches: form.branches, scope: form.scope }]);
    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); }
    else { setMsg('Agreement saved successfully!'); setForm({ vendor_name:'', agreement_number:'', start_date:'', end_date:'', monthly_value:'', branches:'', scope:'' }); }
  };

  const f = (k, v) => setForm(p => ({...p, [k]: v}));

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Agreements</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Upload and manage vendor agreements</p>
      </div>
      <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',maxWidth:'640px'}}>
        <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Add New Agreement</h3>
        {[['agreement_number','Agreement ID','e.g. AGR-2025-001'],['start_date','Start Date',''],['end_date','End Date',''],['monthly_value','Monthly Value (Rs)','e.g. 50000'],['branches','Branches Covered','e.g. Lucknow, Delhi'],['scope','Scope of Services','Describe services covered']].map(([key,label,ph])=>(
          <div key={key} style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>{label}</label>
            <input type={key.includes('date')?'date':'text'} placeholder={ph} value={form[key]} onChange={e=>f(key,e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827'}} />
          </div>
        ))}
        {msg && <div style={{padding:'12px',borderRadius:'10px',background:msg.includes('Error')?'#fee2e2':'#dcfce7',color:msg.includes('Error')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{msg}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',padding:'13px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{loading?'Saving...':'Save Agreement'}</button>
      </div>
    </div>
  );
}