'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ApprovalsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState({});
  const [acting, setActing] = useState({});

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').in('status', ['pending_approval','review']).order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    setActing(p => ({...p, [id]: true}));
    await supabase.from('approvals').insert([{ invoice_id: id, approver_name: 'Admin', approver_role: 'Approver 1', action, comment: comment[id] || '' }]);
    await supabase.from('invoices').update({ status: action === 'approved' ? 'approved' : 'rejected' }).eq('id', id);
    setInvoices(p => p.filter(i => i.id !== id));
    setActing(p => ({...p, [id]: false}));
  };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Approvals Queue</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Review and approve pending invoices</p>
      </div>
      {loading && <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>Loading invoices...</div>}
      {!loading && invoices.length === 0 && (
        <div style={{background:'white',borderRadius:'16px',padding:'60px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>✅</div>
          <p style={{color:'#64748b',fontSize:'15px',fontWeight:'500'}}>No pending invoices. All clear!</p>
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {invoices.map(inv => (
          <div key={inv.id} style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',margin:0}}>{inv.invoice_number}</p>
                <p style={{fontSize:'13px',color:'#64748b',margin:'4px 0 0'}}>{inv.expense_type} • {inv.location} • {inv.service_month}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',margin:0}}>Rs. {inv.total_amount?.toLocaleString()}</p>
                <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:inv.status==='pending_approval'?'#dbeafe':'#fef9c3',color:inv.status==='pending_approval'?'#1d4ed8':'#ca8a04'}}>{inv.status==='pending_approval'?'Pending Approval':'Needs Review'}</span>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px',background:'#f8fafc',borderRadius:'10px',padding:'12px'}}>
              {[['Invoice Date',inv.invoice_date],['Base Amount','Rs. '+(inv.base_amount||0)],['GST','Rs. '+(inv.gst_amount||0)],['Confidence',(inv.confidence_score||97)+'%']].map(([k,v])=>(
                <div key={k}>
                  <p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p>
                  <p style={{fontSize:'13px',fontWeight:'700',color:'#334155',margin:'2px 0 0'}}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{marginBottom:'14px'}}>
              <input placeholder='Add comment (optional)...' value={comment[inv.id]||''} onChange={e=>setComment(p=>({...p,[inv.id]:e.target.value}))} style={{width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'13px',outline:'none',boxSizing:'border-box',color:'#374151'}} />
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>handleAction(inv.id,'approved')} disabled={acting[inv.id]} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>✅ Approve</button>
              <button onClick={()=>handleAction(inv.id,'rejected')} disabled={acting[inv.id]} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>❌ Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}