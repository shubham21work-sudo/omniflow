'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AgreementsPage() {
  const [form, setForm] = useState({ agreement_number:'', start_date:'', end_date:'', monthly_value:'', branches:'', scope:'', vendor_name:'', gst_number:'' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.agreement_number || !form.start_date || !form.end_date) { setMsg('Please fill Agreement ID, Start Date and End Date.'); return; }
    setSaving(true); setMsg('');
    let fileUrl = '';
    if (file) {
      const fileName = Date.now() + '_' + file.name;
      const { error: uploadErr } = await supabase.storage.from('agreements').upload(fileName, file);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('agreements').getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }
    }
    const { error } = await supabase.from('agreements').insert([{
      agreement_number: form.agreement_number,
      start_date: form.start_date,
      end_date: form.end_date,
      monthly_value: parseFloat(form.monthly_value) || 0,
      branches: form.branches,
      scope: form.scope,
      vendor_name: form.vendor_name,
      gst_number: form.gst_number,
      agreement_file_url: fileUrl,
    }]);
    setSaving(false);
    if (error) { setMsg('Error: ' + error.message); }
    else { setMsg('Agreement saved! View it under Active Agreements.'); setForm({ agreement_number:'', start_date:'', end_date:'', monthly_value:'', branches:'', scope:'', vendor_name:'', gst_number:'' }); setFile(null); }
  };

  const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' };
  const labelStyle = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };

  return (
    <div style={{maxWidth:'640px'}}>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Upload Agreement</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Add a new vendor agreement</p>
      </div>

      <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Agreement Details</h3>
        {[['agreement_number','Agreement ID','e.g. AGR-2025-001'],['vendor_name','Vendor Name','e.g. Avon Solutions Pvt Ltd'],['gst_number','Vendor GST Number','e.g. 29AAECA3103D1ZA'],['branches','Branches Covered','e.g. Bengaluru, Lucknow'],['scope','Scope of Work','e.g. Manpower Supply']].map(([key,label,ph])=>(
          <div key={key} style={{marginBottom:'14px'}}>
            <label style={labelStyle}>{label}</label>
            <input value={form[key]} onChange={e=>f(key,e.target.value)} placeholder={ph} style={inputStyle} />
          </div>
        ))}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type='date' value={form.start_date} onChange={e=>f('start_date',e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input type='date' value={form.end_date} onChange={e=>f('end_date',e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={labelStyle}>Monthly Value (Rs)</label>
          <input type='number' value={form.monthly_value} onChange={e=>f('monthly_value',e.target.value)} placeholder='e.g. 50000' style={inputStyle} />
        </div>
        <div style={{marginBottom:'20px'}}>
          <label style={labelStyle}>Upload Agreement File (PDF/JPG)</label>
          <div style={{border:'2px dashed #e5e7eb',borderRadius:'10px',padding:'16px',textAlign:'center'}}>
            <input type='file' accept='.pdf,.jpg,.jpeg,.png' onChange={e=>setFile(e.target.files[0])} style={{display:'none'}} id='agr-file' />
            <label htmlFor='agr-file' style={{cursor:'pointer',fontSize:'13px',color:'#7c3aed',fontWeight:'600'}}>
              {file ? file.name : 'Click to attach file (optional)'}
            </label>
          </div>
        </div>
        {msg && <div style={{padding:'10px 14px',borderRadius:'10px',background:msg.includes('Error')||msg.includes('Please')?'#fee2e2':'#dcfce7',color:msg.includes('Error')||msg.includes('Please')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{msg}</div>}
        <button onClick={handleSave} disabled={saving} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{saving?'Saving...':'Save Agreement'}</button>
      </div>
    </div>
  );
}