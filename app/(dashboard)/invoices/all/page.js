'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    const all = invs || [];
    const ids = all.map(i => i.id);
    let paidSet = {};
    if (ids.length > 0) {
      const { data: fq } = await supabase.from('finance_queue').select('invoice_id,status').in('invoice_id', ids);
      (fq || []).forEach(f => { if (f.status === 'paid') paidSet[f.invoice_id] = true; });
    }
    const merged = all.map(i => ({ ...i, derivedStatus: paidSet[i.id] ? 'paid' : i.status }));
    setInvoices(merged);
    setLoading(false);
  };

  const statusStyle = {
    pending_approval: { bg:'#dbeafe', text:'#1d4ed8', label:'Pending' },
    review: { bg:'#fef9c3', text:'#ca8a04', label:'Review' },
    approved: { bg:'#dcfce7', text:'#16a34a', label:'Approved' },
    rejected: { bg:'#fee2e2', text:'#dc2626', label:'Rejected' },
    paid: { bg:'#f0fdf4', text:'#15803d', label:'Paid' },
  };

  const matchFilter = (i) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return i.derivedStatus === 'pending_approval' || i.derivedStatus === 'review';
    return i.derivedStatus === filter;
  };
  const shown = invoices.filter(i => matchFilter(i) && (!search.trim() || (i.vendor_name||'').toLowerCase().includes(search.toLowerCase()) || (i.invoice_number||'').toLowerCase().includes(search.toLowerCase())));

  const counts = {
    all: invoices.length,
    pending: invoices.filter(i=>i.derivedStatus==='pending_approval'||i.derivedStatus==='review').length,
    approved: invoices.filter(i=>i.derivedStatus==='approved').length,
    rejected: invoices.filter(i=>i.derivedStatus==='rejected').length,
    paid: invoices.filter(i=>i.derivedStatus==='paid').length,
  };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Active Invoices</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>All invoices across every stage</p>
      </div>

      <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
        {[['all','All ('+counts.all+')'],['pending','Pending ('+counts.pending+')'],['approved','Approved ('+counts.approved+')'],['paid','Paid ('+counts.paid+')'],['rejected','Rejected ('+counts.rejected+')']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:'8px 16px',borderRadius:'10px',border:'1px solid '+(filter===k?'#7c3aed':'#e2e8f0'),background:filter===k?'#ede9fe':'white',color:filter===k?'#7c3aed':'#475569',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>{l}</button>
        ))}
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search by vendor or invoice number...' style={{width:'100%',maxWidth:'360px',padding:'10px 14px',borderRadius:'10px',border:'1px solid #e2e8f0',fontSize:'13px',outline:'none',marginBottom:'20px'}} />

      {loading && <p style={{color:'#94a3b8',fontSize:'14px',textAlign:'center',padding:'40px'}}>Loading...</p>}
      {!loading && shown.length===0 && (
        <div style={{background:'white',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <p style={{color:'#94a3b8',fontSize:'14px'}}>No invoices here.</p>
        </div>
      )}
      {!loading && shown.length>0 && (
        <div style={{background:'white',borderRadius:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid #f1f5f9',textAlign:'left'}}>
                {['Vendor','Invoice No','Category','Amount','Status','Date'].map(h=>(
                  <th key={h} style={{padding:'12px 16px',fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(i=>{
                const st = statusStyle[i.derivedStatus] || { bg:'#f1f5f9', text:'#475569', label:i.derivedStatus||'-' };
                return (
                  <tr key={i.id} style={{borderBottom:'1px solid #f8fafc'}}>
                    <td style={{padding:'14px 16px',fontSize:'13px',fontWeight:'600',color:'#0f172a'}}>{i.vendor_name||'-'}</td>
                    <td style={{padding:'14px 16px',fontSize:'13px',color:'#475569'}}>{i.invoice_number||'-'}</td>
                    <td style={{padding:'14px 16px',fontSize:'12px',color:'#64748b'}}>{i.category||'-'}</td>
                    <td style={{padding:'14px 16px',fontSize:'13px',fontWeight:'700',color:'#0f172a'}}>Rs. {Number(i.total_amount||0).toLocaleString('en-IN')}</td>
                    <td style={{padding:'14px 16px'}}><span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:st.bg,color:st.text}}>{st.label}</span></td>
                    <td style={{padding:'14px 16px',fontSize:'12px',color:'#94a3b8'}}>{i.invoice_date||'-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}