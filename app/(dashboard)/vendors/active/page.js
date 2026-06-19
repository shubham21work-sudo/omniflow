'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function ActiveVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    setVendors(data || []);
    setLoading(false);
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

  const categoryColors = { Manpower:{bg:'#ede9fe',text:'#7c3aed'}, IT:{bg:'#dbeafe',text:'#1d4ed8'}, Logistics:{bg:'#dcfce7',text:'#16a34a'}, Facilities:{bg:'#fef9c3',text:'#ca8a04'}, Other:{bg:'#f1f5f9',text:'#475569'} };

  const shown = vendors.filter(v => !search.trim() || (v.name||'').toLowerCase().includes(search.toLowerCase()) || (v.gstin||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Active Vendors</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>All registered vendors</p>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search by name or GSTIN...' style={{flex:1,minWidth:'220px',maxWidth:'360px',padding:'10px 14px',borderRadius:'10px',border:'1px solid #e2e8f0',fontSize:'13px',outline:'none'}} />
        <span style={{fontSize:'13px',fontWeight:'600',color:'#7c3aed'}}>{vendors.length} total</span>
      </div>

      {loading && <p style={{color:'#94a3b8',fontSize:'14px',textAlign:'center',padding:'40px'}}>Loading...</p>}
      {!loading && shown.length===0 && (
        <div style={{background:'white',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <p style={{color:'#94a3b8',fontSize:'14px'}}>No vendors found.</p>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'14px'}}>
        {shown.map(v=>{
          const cc = categoryColors[v.category] || categoryColors.Other;
          return (
            <div key={v.id} style={{background:'white',borderRadius:'14px',padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'15px',flexShrink:0}}>{v.name[0].toUpperCase()}</div>
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
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button onClick={()=>handleDelete(v.id)} style={{padding:'7px 14px',borderRadius:'8px',background:'#fee2e2',color:'#dc2626',fontSize:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}