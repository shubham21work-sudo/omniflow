'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function VendorsPage() {
  const [form, setForm] = useState({ name:'', gstin:'', pan:'', category:'manpower' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from('vendors').insert([form]);
    setLoading(false);
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('Vendor registered!'); setForm({ name:'', gstin:'', pan:'', category:'manpower' }); }
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Vendors</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Register and manage vendors</p>
      </div>
      <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',maxWidth:'540px'}}>
        <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Register New Vendor</h3>
        {[['name','Vendor Name','e.g. Avon Solutions Pvt Ltd'],['gstin','GSTIN','e.g. 29AAECA3103D1ZA'],['pan','PAN Number','e.g. AAECA3103D']].map(([key,label,ph])=>(
          <div key={key} style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>{label}</label>
            <input placeholder={ph} value={form[key]} onChange={e=>f(key,e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827'}} />
          </div>
        ))}
        <div style={{marginBottom:'20px'}}>
          <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Category</label>
          <select value={form.category} onChange={e=>f('category',e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827',background:'white'}}>
            <option value='manpower'>Manpower</option>
            <option value='catering'>Catering</option>
            <option value='logistics'>Logistics</option>
            <option value='it'>IT Services</option>
            <option value='facility'>Facility Mgmt</option>
          </select>
        </div>
        {msg && <div style={{padding:'12px',borderRadius:'10px',background:msg.includes('Error')?'#fee2e2':'#dcfce7',color:msg.includes('Error')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{msg}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',padding:'13px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{loading?'Saving...':'Register Vendor'}</button>
      </div>
    </div>
  );
}