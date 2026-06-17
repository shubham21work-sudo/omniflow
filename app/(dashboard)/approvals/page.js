'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const stageLabels = { 1:'Approver 1', 2:'Approver 2', 3:'Approver 3' };

export default function ApprovalsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState({});
  const [acting, setActing] = useState({});
  const [selected, setSelected] = useState([]);
  const [bulkActing, setBulkActing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [myStage, setMyStage] = useState(null);
  const [approverSettings, setApproverSettings] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email || '';
      setUserEmail(email);
      const { data: settings } = await supabase.from('approver_settings').select('*').order('stage');
      setApproverSettings(settings || []);
      const myApprover = (settings || []).find(a => a.email.toLowerCase() === email.toLowerCase());
      const stage = myApprover ? myApprover.stage : null;
      setMyStage(stage);
      await fetchItems(stage);
    })();
  }, []);

  const fetchItems = async (stage) => {
    setLoading(true);
    const { data: workflows } = await supabase.from('approval_workflow').select('*').eq('final_status','pending').order('created_at',{ascending:false});
    const filtered = stage ? (workflows||[]).filter(w => w.current_stage === stage) : (workflows||[]);
    const invoiceIds = filtered.map(w => w.invoice_id);
    let invoiceMap = {};
    if (invoiceIds.length > 0) {
      const { data: invs } = await supabase.from('invoices').select('*').in('id', invoiceIds);
      (invs||[]).forEach(inv => { invoiceMap[inv.id] = inv; });
    }
    setItems(filtered.map(w => ({...w, invoice: invoiceMap[w.invoice_id]})).filter(w => w.invoice));
    setLoading(false);
  };

  const sendNotification = async (stage, invoiceData) => {
    const nextApprover = approverSettings.find(a => a.stage === stage);
    if (!nextApprover) return;
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: nextApprover.email,
        approverName: nextApprover.name,
        invoiceNumber: invoiceData.invoice_number || 'N/A',
        vendorName: invoiceData.vendor_name || 'N/A',
        amount: Number(invoiceData.total_amount || 0).toLocaleString(),
        stage,
        appUrl: window.location.origin,
        invoiceFileUrl: invoiceData.invoice_file_url || '',
      }),
    });
  };

  const processAction = async (workflow, action) => {
    const stage = workflow.current_stage;
    const statusKey = 'approver_' + stage + '_status';
    const inv = workflow.invoice;
    if (action === 'rejected') {
      await supabase.from('approval_workflow').update({ [statusKey]:'rejected', final_status:'rejected' }).eq('id', workflow.id);
      await supabase.from('invoices').update({ status:'rejected' }).eq('id', workflow.invoice_id);
    } else {
      const updates = { [statusKey]:'approved' };
      if (stage >= 3) {
        updates.final_status = 'approved';
        await supabase.from('invoices').update({ status:'approved' }).eq('id', workflow.invoice_id);
        await supabase.from('finance_queue').insert([{ invoice_id: workflow.invoice_id, status:'unpaid' }]);
      } else {
        updates.current_stage = stage + 1;
        await sendNotification(stage + 1, inv);
      }
      await supabase.from('approval_workflow').update(updates).eq('id', workflow.id);
    }
    await supabase.from('approvals').insert([{ invoice_id: workflow.invoice_id, approver_name: userEmail, approver_role: stageLabels[stage], action, comment: comment[workflow.id]||'' }]);
  };

  const handleAction = async (workflow, action) => {
    setActing(p => ({...p, [workflow.id]: true}));
    await processAction(workflow, action);
    setItems(p => p.filter(i => i.id !== workflow.id));
    setSelected(p => p.filter(id => id !== workflow.id));
    setActing(p => ({...p, [workflow.id]: false}));
  };

  const handleBulkAction = async (action) => {
    if (selected.length === 0) return;
    if (!confirm(action === 'approved' ? 'Approve ' + selected.length + ' selected invoices?' : 'Reject ' + selected.length + ' selected invoices?')) return;
    setBulkActing(true);
    const toProcess = items.filter(w => selected.includes(w.id));
    for (const workflow of toProcess) {
      await processAction(workflow, action);
    }
    setItems(p => p.filter(w => !selected.includes(w.id)));
    setSelected([]);
    setBulkActing(false);
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === items.length ? [] : items.map(i => i.id));

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Approvals Queue</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>{myStage ? 'Showing invoices for your stage (' + stageLabels[myStage] + ')' : 'Admin view — all pending approvals'}</p>
      </div>

      {myStage && (
        <div style={{background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',borderRadius:'12px',padding:'14px 20px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'13px'}}>{myStage}</div>
          <div>
            <p style={{fontSize:'13px',fontWeight:'700',color:'#4c1d95',margin:0}}>Logged in as {stageLabels[myStage]}</p>
            <p style={{fontSize:'12px',color:'#6d28d9',margin:0}}>{userEmail}</p>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{background:'white',borderRadius:'14px',padding:'16px 20px',marginBottom:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <input type='checkbox' checked={selected.length===items.length} onChange={toggleAll} style={{width:'18px',height:'18px',cursor:'pointer',accentColor:'#7c3aed'}} />
            <span style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>
              {selected.length === 0 ? 'Select All (' + items.length + ' invoices)' : selected.length + ' of ' + items.length + ' selected'}
            </span>
          </div>
          {selected.length > 0 && (
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>handleBulkAction('approved')} disabled={bulkActing} style={{padding:'9px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>
                {bulkActing ? 'Processing...' : '✅ Approve Selected (' + selected.length + ')'}
              </button>
              <button onClick={()=>handleBulkAction('rejected')} disabled={bulkActing} style={{padding:'9px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>
                {bulkActing ? 'Processing...' : '❌ Reject Selected (' + selected.length + ')'}
              </button>
            </div>
          )}
        </div>
      )}

      {loading && <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>Loading...</div>}
      {!loading && items.length===0 && (
        <div style={{background:'white',borderRadius:'16px',padding:'60px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>✅</div>
          <p style={{color:'#64748b',fontSize:'15px',fontWeight:'500'}}>No pending approvals for your stage. All clear!</p>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {items.map(w => {
          const inv = w.invoice;
          const isSelected = selected.includes(w.id);
          return (
            <div key={w.id} style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border: isSelected ? '2px solid #7c3aed' : '1px solid #f1f5f9',transition:'border 0.15s'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'16px'}}>
                <input type='checkbox' checked={isSelected} onChange={()=>toggleSelect(w.id)} style={{width:'18px',height:'18px',marginTop:'3px',cursor:'pointer',accentColor:'#7c3aed',flexShrink:0}} />
                <div style={{flex:1,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <p style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',margin:0}}>{inv.invoice_number}</p>
                    <p style={{fontSize:'13px',color:'#64748b',margin:'4px 0 0'}}>{inv.vendor_name} — {inv.location}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',margin:0}}>Rs. {Number(inv.total_amount).toLocaleString()}</p>
                    <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:'#ede9fe',color:'#7c3aed'}}>Stage {w.current_stage}: {stageLabels[w.current_stage]}</span>
                  </div>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
                {[1,2,3].map(stage => {
                  const key = 'approver_' + stage + '_status';
                  const st = w[key];
                  const color = st==='approved'?'#10b981':st==='rejected'?'#ef4444':stage===w.current_stage?'#7c3aed':'#e2e8f0';
                  const textColor = (st||stage===w.current_stage)?'white':'#94a3b8';
                  const label = st==='approved'?'✓ Approved':st==='rejected'?'✗ Rejected':stage===w.current_stage?'In Review':'Waiting';
                  return (
                    <div key={stage} style={{flex:1,textAlign:'center',padding:'10px',borderRadius:'10px',background:color,color:textColor}}>
                      <p style={{fontSize:'11px',fontWeight:'700',margin:0,textTransform:'uppercase'}}>Approver {stage}</p>
                      <p style={{fontSize:'11px',margin:'2px 0 0'}}>{label}</p>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px',background:'#f8fafc',borderRadius:'10px',padding:'12px'}}>
                {[['Invoice Date',inv.invoice_date||'-'],['GST',inv.gst_number||'-'],['GST Amount','Rs. '+(inv.gst_amount||0)],['Confidence',(inv.confidence_score||0)+'%']].map(([k,v])=>(
                  <div key={k}>
                    <p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'#334155',margin:'2px 0 0'}}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:'14px'}}>
                <input placeholder='Add comment (optional)...' value={comment[w.id]||''} onChange={e=>setComment(p=>({...p,[w.id]:e.target.value}))} style={{width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'13px',outline:'none',boxSizing:'border-box',color:'#374151'}} />
              </div>
              <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                <button onClick={()=>handleAction(w,'approved')} disabled={acting[w.id]} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>{acting[w.id]?'Processing...':w.current_stage>=3?'✅ Final Approve':'✅ Approve & Notify Next'}</button>
                <button onClick={()=>handleAction(w,'rejected')} disabled={acting[w.id]} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>❌ Reject</button>
                {inv.invoice_file_url ? (
                  <a href={inv.invoice_file_url} target='_blank' rel='noopener noreferrer' style={{padding:'11px 16px',borderRadius:'10px',background:'#f1f5f9',color:'#374151',fontSize:'13px',fontWeight:'600',border:'1px solid #e5e7eb',textDecoration:'none',whiteSpace:'nowrap'}}>📎 View Invoice</a>
                ) : (
                  <span style={{padding:'11px 16px',borderRadius:'10px',background:'#f8fafc',color:'#cbd5e1',fontSize:'13px',fontWeight:'600',border:'1px dashed #e5e7eb',whiteSpace:'nowrap'}}>No File</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}