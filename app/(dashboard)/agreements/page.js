'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AgreementsPage() {
  const [form, setForm] = useState({ agreement_number:'', start_date:'', end_date:'', monthly_value:'', branches:'', scope:'', vendor_name:'', gst_number:'' });
  const [file, setFile] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAgreements(); }, []);

  const fetchAgreements = async () => {
    const { data } = await supabase.from('agreements').select('*').order('created_at', { ascending: false });
    setAgreements(data || []);
    setLoading(false);
  };

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
    else { setMsg('Agreement saved!'); setForm({ agreement_number:'', start_date:'', end_date:'', monthly_value:'', branches:'', scope:'', vendor_name:'', gst_number:'' }); setFile(null); fetchAgreements(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this agreement?')) return;
    await supabase.from('agreements').delete().eq('id', id);
    setAgreements(p => p.filter(a => a.id !== id));
  };

  const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' };
  const labelStyle = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };

  const isActive = (a) => {
    const today = new Date();
    return new Date(a.start_date) <= today && new Date(a.end_date) >= today;
  };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Agreements</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Add and manage vendor agreements</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',alignItems:'start'}}>

        <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Add New Agreement</h3>
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
                {file ? file.name : '📎 Click to attach file (optional)'}
              </label>
            </div>
          </div>
          {msg && <div style={{padding:'10px 14px',borderRadius:'10px',background:msg.includes('Error')||msg.includes('Please')?'#fee2e2':'#dcfce7',color:msg.includes('Error')||msg.includes('Please')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{msg}</div>}
          <button onClick={handleSave} disabled={saving} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{saving?'Saving...':'Save Agreement'}</button>
        </div>

        <div>
          <div style={{background:'white',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',marginBottom:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',margin:0}}>All Agreements</h3>
              <span style={{fontSize:'13px',fontWeight:'600',color:'#7c3aed'}}>{agreements.length} total</span>
            </div>
          </div>
          {loading && <p style={{color:'#94a3b8',fontSize:'14px',textAlign:'center',padding:'40px'}}>Loading...</p>}
          {!loading && agreements.length===0 && (
            <div style={{background:'white',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
              <p style={{color:'#94a3b8',fontSize:'14px'}}>No agreements yet. Add your first one!</p>
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {agreements.map(a=>(
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
                    <a href={a.agreement_file_url} target='_blank' rel='noopener noreferrer' style={{flex:1,padding:'8px',borderRadius:'8px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'12px',fontWeight:'600',border:'none',cursor:'pointer',textAlign:'center',textDecoration:'none'}}>📥 Download File</a>
                  ) : (
                    <span style={{flex:1,padding:'8px',borderRadius:'8px',background:'#f1f5f9',color:'#94a3b8',fontSize:'12px',fontWeight:'600',textAlign:'center'}}>No file attached</span>
                  )}
                  <button onClick={()=>handleDelete(a.id)} style={{padding:'8px 14px',borderRadius:'8px',background:'#fee2e2',color:'#dc2626',fontSize:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}