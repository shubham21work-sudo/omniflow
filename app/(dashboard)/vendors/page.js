'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function UploadVendorPage() {
  const [form, setForm] = useState({ name:'', pan:'', category:'Manpower', contact_person:'', email:'', phone:'' });
  const [gstList, setGstList] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const updateGst = (i, val) => setGstList(p => p.map((g, idx) => idx === i ? val : g));
  const addGst = () => setGstList(p => [...p, '']);
  const removeGst = (i) => setGstList(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const joinedGst = gstList.map(g=>g.trim()).filter(Boolean).join(', ');
    if (!form.name || !joinedGst) { setMsg('Vendor Name and at least one GSTIN are required.'); return; }
    setSaving(true); setMsg('');
    const payload = { name: form.name, gstin: joinedGst, pan: form.pan, category: form.category, contact_person: form.contact_person, email: form.email, phone: form.phone, status: 'active' };
    const { error } = await supabase.from('vendors').insert([payload]);
    setSaving(false);
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('Vendor registered! View it under Active Vendors.'); setForm({ name:'', pan:'', category:'Manpower', contact_person:'', email:'', phone:'' }); setGstList(['']); }
  };

  const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' };
  const labelStyle = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };

  return (
    <div style={{maxWidth:'640px'}}>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Upload Vendor</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Register a new vendor</p>
      </div>

      <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Vendor Details</h3>
        <div style={{marginBottom:'14px'}}>
          <label style={labelStyle}>Vendor Name *</label>
          <input value={form.name} onChange={e=>f('name',e.target.value)} placeholder='e.g. Avon Solutions Pvt Ltd' style={inputStyle} />
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={labelStyle}>GSTIN *</label>
          {gstList.map((g, i) => (
            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <input value={g} onChange={e=>updateGst(i, e.target.value)} placeholder='e.g. 29AAECA3103D1ZA' style={{...inputStyle, flex:1}} />
              {gstList.length > 1 && <button type='button' onClick={()=>removeGst(i)} style={{padding:'0 14px',borderRadius:'10px',border:'1px solid #fecaca',background:'#fee2e2',color:'#dc2626',fontWeight:'700',cursor:'pointer'}}>X</button>}
            </div>
          ))}
          <button type='button' onClick={addGst} style={{padding:'8px 14px',borderRadius:'8px',border:'1px dashed #c4b5fd',background:'#f5f3ff',color:'#7c3aed',fontSize:'13px',fontWeight:'600',cursor:'pointer',marginBottom:'4px'}}>+ Add another GST</button>
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={labelStyle}>PAN Number</label>
          <input value={form.pan} onChange={e=>f('pan',e.target.value)} placeholder='e.g. AAECA3103D' style={inputStyle} />
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={labelStyle}>Category</label>
          <select value={form.category} onChange={e=>f('category',e.target.value)} style={{...inputStyle,background:'white'}}>
            {['Manpower','IT','Logistics','Facilities','Other'].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={labelStyle}>Contact Person</label>
          <input value={form.contact_person} onChange={e=>f('contact_person',e.target.value)} placeholder='e.g. Rajesh Sharma' style={inputStyle} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'20px'}}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type='email' value={form.email} onChange={e=>f('email',e.target.value)} placeholder='vendor@email.com' style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder='9876543210' style={inputStyle} />
          </div>
        </div>
        {msg && <div style={{padding:'10px 14px',borderRadius:'10px',background:msg.includes('Error')||msg.includes('required')?'#fee2e2':'#dcfce7',color:msg.includes('Error')||msg.includes('required')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{msg}</div>}
        <button onClick={handleSave} disabled={saving} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{saving?'Saving...':'Register Vendor'}</button>
      </div>
    </div>
  );
}