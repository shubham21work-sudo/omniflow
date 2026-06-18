'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function VendorsPage() {
  const [form, setForm] = useState({ name:'', gstin:'', pan:'', category:'Manpower', contact_person:'', email:'', phone:'' });
  const [gstList, setGstList] = useState(['']);
  const updateGst = (i, val) => setGstList(p => p.map((g, idx) => idx === i ? val : g));
  const addGst = () => setGstList(p => [...p, '']);
  const removeGst = (i) => setGstList(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const startEdit = (v) => {
    setForm({ name: v.name||'', gstin: v.gstin||'', pan: v.pan||'', category: v.category||'Manpower', contact_person: v.contact_person||'', email: v.email||'', phone: v.phone||'' });
    const gsts = (v.gstin||'').split(',').map(g=>g.trim()).filter(Boolean);
    setGstList(gsts.length > 0 ? gsts : ['']);
    setEditingId(v.id);
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [vendors, setVendors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    setVendors(data || []);
    setLoading(false);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const joinedGst = gstList.map(g=>g.trim()).filter(Boolean).join(', ');
    if (!form.name || !joinedGst) { setMsg('Vendor Name and at least one GSTIN are required.'); return; }
    form.gstin = joinedGst;
    setSaving(true); setMsg('');
    const payload = { name: form.name, gstin: form.gstin, pan: form.pan, category: form.category, contact_person: form.contact_person, email: form.email, phone: form.phone };
      let error;
      if (editingId) { const r = await supabase.from('vendors').update(payload).eq('id', editingId); error = r.error; }
      else { payload.status = 'active'; const r = await supabase.from('vendors').insert([payload]); error = r.error; }
      const _ignore = ({
      name: form.name,
      gstin: form.gstin,
      pan: form.pan,
      category: form.category,
      contact_person: form.contact_person,
      email: form.email,
      phone: form.phone,
      status: 'active'
    });
    setSaving(false);
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('Vendor registered!'); setForm({ name:'', gstin:'', pan:'', category:'Manpower', contact_person:'', email:'', phone:'' }); fetchVendors(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor and ALL its invoices, agreements and related records? This cannot be undone.')) return;
    const { data: invs } = await supabase.from('invoices').select('id').eq('vendor_id', id);
    const invoiceIds = (invs || []).map(i => i.id);
    if (invoiceIds.length > 0) {
      await supabase.from('approvals').delete().in('invoice_id', invoiceIds);
      await supabase.from('approval_workflow').delete().in('invoice_id', invoiceIds);
      await supabase.from('finance_queue').delete().in('invoice_id', invoiceIds);
      await supabase.from('invoices').delete().in('id', invoiceIds);
    }
    await supabase.from('agreements').delete().eq('vendor_id', id);
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) { alert('Could not delete vendor: ' + error.message); return; }
    setVendors(p => p.filter(v => v.id !== id));
  };

  const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' };
  const labelStyle = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };
  const categoryColors = { Manpower:{bg:'#ede9fe',text:'#7c3aed'}, IT:{bg:'#dbeafe',text:'#1d4ed8'}, Logistics:{bg:'#dcfce7',text:'#16a34a'}, Facilities:{bg:'#fef9c3',text:'#ca8a04'}, Other:{bg:'#f1f5f9',text:'#475569'} };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Vendors</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Register and manage vendors</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',alignItems:'start'}}>

        <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Register New Vendor</h3>
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
          <button onClick={handleSave} disabled={saving} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{saving?'Saving...':(editingId?'Update Vendor':'Register Vendor')}</button>
        </div>

        <div>
          <div style={{background:'white',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',marginBottom:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',margin:0}}>Registered Vendors</h3>
              <span style={{fontSize:'13px',fontWeight:'600',color:'#7c3aed'}}>{vendors.length} total</span>
            </div>
          </div>
          {loading && <p style={{color:'#94a3b8',fontSize:'14px',textAlign:'center',padding:'40px'}}>Loading...</p>}
          {!loading && vendors.length===0 && (
            <div style={{background:'white',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
              <p style={{color:'#94a3b8',fontSize:'14px'}}>No vendors yet. Register your first one!</p>
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {vendors.map(v=>{
              const cc = categoryColors[v.category] || categoryColors.Other;
              return (
                <div key={v.id} style={{background:'white',borderRadius:'14px',padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'15px',flexShrink:0}}>
                        {v.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:'700',color:'#0f172a',margin:0}}>{v.name}</p>
                        {v.contact_person && <p style={{fontSize:'12px',color:'#64748b',margin:'2px 0 0'}}>{v.contact_person}</p>}
                      </div>
                    </div>
                    <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:cc.bg,color:cc.text,flexShrink:0,marginLeft:'8px'}}>{v.category}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px',background:'#f8fafc',borderRadius:'8px',padding:'10px'}}>
                    {[['GSTIN',v.gstin||'-'],['PAN',v.pan||'-'],['Email',v.email||'-'],['Phone',v.phone||'-']].map(([k,val])=>(
                      <div key={k}>
                        <p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p>
                        <p style={{fontSize:'12px',fontWeight:'600',color:'#334155',margin:'2px 0 0',wordBreak:'break-all'}}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}>
                    <button onClick={()=>startEdit(v)} style={{padding:'7px 14px',borderRadius:'8px',background:'#ede9fe',color:'#7c3aed',fontSize:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Edit</button>
                    <button onClick={()=>handleDelete(v.id)} style={{padding:'7px 14px',borderRadius:'8px',background:'#fee2e2',color:'#dc2626',fontSize:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}