'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function FinancePage() {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [remark, setRemark] = useState({});
  const [utr, setUtr] = useState({});
  const [slip, setSlip] = useState({});
  const [editInvoice, setEditInvoice] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => { fetchItems(); fetchRejected(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data: fq } = await supabase.from('finance_queue').select('*').order('id',{ascending:false});
    const ids = (fq||[]).map(f=>f.invoice_id);
    let invMap = {};
    if (ids.length>0) {
      const { data: invs } = await supabase.from('invoices').select('*').in('id',ids);
      (invs||[]).forEach(inv=>{ invMap[inv.id]=inv; });
    }
    let wfMap = {}; let apprNames = {};
      if (ids.length>0) {
        const { data: wfs } = await supabase.from('approval_workflow').select('*').in('invoice_id', ids);
        (wfs||[]).forEach(w=>{ wfMap[w.invoice_id]=w; });
        const { data: appr } = await supabase.from('approver_settings').select('*');
        (appr||[]).forEach(a=>{ apprNames[a.stage]=a.name; });
      }
      setItems((fq||[]).map(f=>({...f,invoice:invMap[f.invoice_id],workflow:wfMap[f.invoice_id],approverNames:apprNames})).filter(f=>f.invoice));
    setLoading(false);
  };

  const fetchRejected = async () => {
    const { data } = await supabase.from('invoices').select('*').eq('status','rejected').order('created_at',{ascending:false});
    setRejected(data||[]);
  };

  const financeAction = async (item, action) => {
    setUpdating(p=>({...p,[item.id]:true}));
    const fin_remark = remark[item.id] || '';
    if (action === 'rejected') {
      await supabase.from('finance_queue').update({ finance_status:'rejected', finance_remark: fin_remark }).eq('id',item.id);
      await supabase.from('invoices').update({ status:'rejected', rejection_remark: fin_remark, rejection_source:'finance' }).eq('id',item.invoice_id);
      setItems(p=>p.filter(i=>i.id!==item.id));
      await fetchRejected();
    } else {
      await supabase.from('finance_queue').update({ finance_status:'approved', finance_remark: fin_remark, finance_approved_at: new Date().toISOString() }).eq('id',item.id);
      setItems(p=>p.map(i=>i.id===item.id?{...i,finance_status:'approved',finance_remark:fin_remark}:i));
    }
    setUpdating(p=>({...p,[item.id]:false}));
  };

  const markPaid = async (item) => {
    const utrVal = utr[item.id] || item.utr_number || '';
    if (!utrVal) { alert('Please enter UTR number before marking as paid.'); return; }
    setUpdating(p=>({...p,[item.id]:true}));
    let slipUrl = item.payment_slip_url || '';
    if (slip[item.id]) {
      const fileName = Date.now()+'_slip_'+slip[item.id].name;
      const { error } = await supabase.storage.from('invoices').upload(fileName, slip[item.id]);
      if (!error) {
        const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(fileName);
        slipUrl = urlData.publicUrl;
      }
    }
    await supabase.from('finance_queue').update({ status:'paid', utr_number:utrVal, payment_slip_url:slipUrl, payment_date:new Date().toISOString().slice(0,10) }).eq('id',item.id);
    setItems(p=>p.map(i=>i.id===item.id?{...i,status:'paid',utr_number:utrVal,payment_slip_url:slipUrl}:i));
    setUpdating(p=>({...p,[item.id]:false}));
  };

  const markProcessing = async (item) => {
    await supabase.from('finance_queue').update({ status:'processing' }).eq('id',item.id);
    setItems(p=>p.map(i=>i.id===item.id?{...i,status:'processing'}:i));
  };

  const handleDelete = async (inv) => {
    if (!confirm('Delete this invoice permanently?')) return;
    await supabase.from('approvals').delete().eq('invoice_id',inv.id);
    await supabase.from('approval_workflow').delete().eq('invoice_id',inv.id);
    await supabase.from('finance_queue').delete().eq('invoice_id',inv.id);
    await supabase.from('invoices').delete().eq('id',inv.id);
    setRejected(p=>p.filter(i=>i.id!==inv.id));
  };

  const startEdit = (inv) => {
    setEditInvoice(inv);
    setEditForm({ vendor_name:inv.vendor_name||'', invoice_number:inv.invoice_number||'', invoice_date:inv.invoice_date||'', gst_number:inv.gst_number||'', base_amount:inv.base_amount||'', gst_amount:inv.gst_amount||'', total_amount:inv.total_amount||'', location:inv.location||'', resubmit_route:inv.resubmit_route||'3stage' });
  };

  const handleResubmit = async () => {
    if (!editInvoice) return;
    setSaving(true);
    const route = editForm.resubmit_route;
    await supabase.from('invoices').update({ vendor_name:editForm.vendor_name, invoice_number:editForm.invoice_number, invoice_date:editForm.invoice_date||null, gst_number:editForm.gst_number, base_amount:parseFloat(editForm.base_amount)||0, gst_amount:parseFloat(editForm.gst_amount)||0, total_amount:parseFloat(editForm.total_amount)||0, location:editForm.location, status:route==='finance'?'approved':'pending_approval', rejection_remark:null, rejection_source:null }).eq('id',editInvoice.id);
    await supabase.from('approval_workflow').delete().eq('invoice_id',editInvoice.id);
    await supabase.from('finance_queue').delete().eq('invoice_id',editInvoice.id);
    if (route==='3stage') {
      await supabase.from('approval_workflow').insert([{invoice_id:editInvoice.id,current_stage:1}]);
    } else {
      await supabase.from('finance_queue').insert([{invoice_id:editInvoice.id,status:'unpaid',finance_status:'pending_finance'}]);
    }
    setSaving(false);
    setEditInvoice(null);
    setRejected(p=>p.filter(i=>i.id!==editInvoice.id));
  };

  // Export selected paid invoices to Excel/CSV
  const exportSelected = () => {
    const paidItems = items.filter(i=>i.status==='paid');
    const toExport = selected.length>0 ? paidItems.filter(i=>selected.includes(i.id)) : paidItems;
    if (toExport.length===0) { alert('No paid invoices to export.'); return; }
    const headers = ['Vendor Name','Invoice Number','Invoice Date','GST Number','Base Amount','GST Amount','Total Amount','UTR Number','Payment Date','Payment Slip URL','Invoice File URL'];
    const rows = toExport.map(i=>[
      i.invoice?.vendor_name||'',
      i.invoice?.invoice_number||'',
      i.invoice?.invoice_date||'',
      i.invoice?.gst_number||'',
      i.invoice?.base_amount||0,
      i.invoice?.gst_amount||0,
      i.invoice?.total_amount||0,
      i.utr_number||'',
      i.payment_date||'',
      i.payment_slip_url||'',
      i.invoice?.invoice_file_url||'',
    ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','),...rows].join('\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'paid_invoices_'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();
  };

  const toggleSelect = (id) => setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleAll = (paidItems) => setSelected(selected.length===paidItems.length?[]:paidItems.map(i=>i.id));

  const inp = (s={}) => ({width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'13px',outline:'none',boxSizing:'border-box',color:'#111827',...s});
  const sc = {unpaid:{bg:'#fef9c3',text:'#ca8a04'},processing:{bg:'#dbeafe',text:'#1d4ed8'},paid:{bg:'#dcfce7',text:'#16a34a'},pending_finance:{bg:'#f3e8ff',text:'#7c3aed'},rejected:{bg:'#fee2e2',text:'#dc2626'}};

  const pendingFinance = items.filter(i=>i.finance_status==='pending_finance'||!i.finance_status);
  const financeApproved = items.filter(i=>i.finance_status==='approved'&&i.status!=='paid');
  const paidItems = items.filter(i=>i.status==='paid');

  return (
    <div>
      {editInvoice && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'28px',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h3 style={{fontSize:'16px',fontWeight:'700',color:'#0f172a',margin:0}}>Edit & Resubmit Invoice</h3>
              <button onClick={()=>setEditInvoice(null)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'#64748b'}}>×</button>
            </div>
            {[['vendor_name','Vendor Name'],['invoice_number','Invoice Number'],['invoice_date','Invoice Date'],['gst_number','GST Number'],['base_amount','Base Amount'],['gst_amount','GST Amount'],['total_amount','Total Amount'],['location','Location']].map(([k,l])=>(
              <div key={k} style={{marginBottom:'12px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>{l}</label>
                <input value={editForm[k]||''} onChange={e=>setEditForm(p=>({...p,[k]:e.target.value}))} style={inp()} />
              </div>
            ))}
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'8px'}}>After editing, send to:</label>
              <div style={{display:'flex',gap:'10px'}}>
                {[['3stage','3-Stage Approval'],['finance','Direct to Finance']].map(([val,label])=>(
                  <div key={val} onClick={()=>setEditForm(p=>({...p,resubmit_route:val}))} style={{flex:1,padding:'12px',borderRadius:'10px',border:'2px solid '+(editForm.resubmit_route===val?'#7c3aed':'#e5e7eb'),background:editForm.resubmit_route===val?'#faf5ff':'white',cursor:'pointer',textAlign:'center'}}>
                    <p style={{fontSize:'12px',fontWeight:'700',color:editForm.resubmit_route===val?'#7c3aed':'#374151',margin:0}}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setEditInvoice(null)} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f1f5f9',color:'#475569',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>Cancel</button>
              <button onClick={handleResubmit} disabled={saving} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>{saving?'Submitting...':'Save & Resubmit'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'24px'}}>
        <div>
          <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Finance Queue</h2>
          <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Verify, process and track invoice payments</p>
        </div>
        <button onClick={exportSelected} style={{padding:'10px 20px',borderRadius:'10px',background:'#0f172a',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {selected.length>0 ? `Export Selected (${selected.length})` : 'Export Paid CSV'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px'}}>
        {[
          {label:'Pending Finance Review',value:pendingFinance.length,bg:'linear-gradient(135deg,#7c3aed,#4f46e5)'},
          {label:'Finance Approved',value:financeApproved.length,bg:'linear-gradient(135deg,#10b981,#0d9488)'},
          {label:'Paid',value:paidItems.length,bg:'linear-gradient(135deg,#38bdf8,#3b82f6)'},
          {label:'Rejected',value:rejected.length,bg:'linear-gradient(135deg,#ef4444,#dc2626)'},
        ].map(s=>(
          <div key={s.label} style={{background:'white',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'10px',background:s.bg,marginBottom:'12px'}}></div>
            <p style={{color:'#64748b',fontSize:'12px',fontWeight:'500',margin:0}}>{s.label}</p>
            <p style={{color:'#0f172a',fontSize:'22px',fontWeight:'700',margin:'2px 0 0'}}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'4px',marginBottom:'20px',background:'white',borderRadius:'12px',padding:'4px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',width:'fit-content'}}>
        {[['pending','Pending Finance Review'],['approved','Finance Approved'],['paid','Paid'],['rejected','Rejected Invoices']].map(([key,label])=>(
          <button key={key} onClick={()=>{setTab(key);setSelected([]);}} style={{padding:'8px 18px',borderRadius:'9px',background:tab===key?'#7c3aed':'transparent',color:tab===key?'white':'#64748b',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>{label}</button>
        ))}
      </div>

      {loading && <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>Loading...</div>}

      {/* PENDING FINANCE REVIEW */}
      {tab==='pending' && !loading && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {pendingFinance.length===0 && <div style={{background:'white',borderRadius:'16px',padding:'50px',textAlign:'center',border:'1px solid #f1f5f9'}}><p style={{color:'#94a3b8',margin:0}}>No invoices pending finance review.</p></div>}
          {pendingFinance.map(item=>(
            <div key={item.id} style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                <div>
                  <p style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',margin:0}}>{item.invoice?.vendor_name}</p>
                  <p style={{fontSize:'13px',color:'#64748b',margin:'3px 0 0'}}>{item.invoice?.invoice_number} • {item.invoice?.location||'-'}</p>
                  {item.invoice?.remark && <div style={{marginTop:'8px',padding:'8px 12px',borderRadius:'8px',background:'#faf5ff',border:'1px solid #e9d5ff'}}><span style={{fontSize:'10px',fontWeight:'700',color:'#7c3aed',textTransform:'uppercase'}}>AI Remark</span><p style={{fontSize:'12px',color:'#475569',margin:'2px 0 0',lineHeight:'1.4'}}>{item.invoice.remark}</p>{item.invoice.category && <span style={{display:'inline-block',marginTop:'6px',fontSize:'10px',fontWeight:'600',padding:'2px 8px',borderRadius:'10px',background:'#ede9fe',color:'#6d28d9'}}>{item.invoice.category}</span>}</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',margin:0}}>Rs. {Number(item.invoice?.total_amount||0).toLocaleString()}</p>
                  <p style={{fontSize:'12px',color:'#94a3b8',margin:'2px 0 0'}}>GST: Rs. {Number(item.invoice?.gst_amount||0).toLocaleString()}</p>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',background:'#f8fafc',borderRadius:'10px',padding:'12px',marginBottom:'14px'}}>
                {[['Invoice Date',item.invoice?.invoice_date||'-'],['GST Number',item.invoice?.gst_number||'-'],['Confidence',(item.invoice?.confidence_score||0)+'%'],['Amount Check',(item.invoice?.agreement_active_score||0)+'%']].map(([k,v])=>(
                  <div key={k}><p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p><p style={{fontSize:'13px',fontWeight:'700',color:'#334155',margin:'2px 0 0'}}>{v}</p></div>
                ))}
              </div>
              <div style={{display:'flex',gap:'10px',marginBottom:'14px'}}>
                {item.invoice?.invoice_file_url && (
                  <a href={item.invoice.invoice_file_url} target='_blank' rel='noopener noreferrer' style={{padding:'8px 14px',borderRadius:'8px',background:'#f1f5f9',color:'#374151',fontSize:'12px',fontWeight:'600',border:'1px solid #e5e7eb',textDecoration:'none'}}>📎 View Invoice</a>
                )}
              </div>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Finance Remark</label>
                <input value={remark[item.id]||''} onChange={e=>setRemark(p=>({...p,[item.id]:e.target.value}))} placeholder='Add verification remark...' style={inp()} />
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>financeAction(item,'approved')} disabled={updating[item.id]} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>✅ Finance Approve</button>
                <button onClick={()=>financeAction(item,'rejected')} disabled={updating[item.id]} style={{flex:1,padding:'11px',borderRadius:'10px',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>❌ Finance Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FINANCE APPROVED - UTR + PAYMENT SLIP */}
      {tab==='approved' && !loading && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {financeApproved.length===0 && <div style={{background:'white',borderRadius:'16px',padding:'50px',textAlign:'center',border:'1px solid #f1f5f9'}}><p style={{color:'#94a3b8',margin:0}}>No finance-approved invoices pending payment.</p></div>}
          {financeApproved.map(item=>(
            <div key={item.id} style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                <div>
                  <p style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',margin:0}}>{item.invoice?.vendor_name}</p>
                  <p style={{fontSize:'13px',color:'#64748b',margin:'3px 0 0'}}>{item.invoice?.invoice_number} • {item.invoice?.location||'-'}</p>
                  {item.invoice?.remark && <div style={{marginTop:'8px',padding:'8px 12px',borderRadius:'8px',background:'#faf5ff',border:'1px solid #e9d5ff'}}><span style={{fontSize:'10px',fontWeight:'700',color:'#7c3aed',textTransform:'uppercase'}}>AI Remark</span><p style={{fontSize:'12px',color:'#475569',margin:'2px 0 0',lineHeight:'1.4'}}>{item.invoice.remark}</p>{item.invoice.category && <span style={{display:'inline-block',marginTop:'6px',fontSize:'10px',fontWeight:'600',padding:'2px 8px',borderRadius:'10px',background:'#ede9fe',color:'#6d28d9'}}>{item.invoice.category}</span>}</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',margin:0}}>Rs. {Number(item.invoice?.total_amount||0).toLocaleString()}</p>
                  <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:sc[item.status]?.bg||'#f1f5f9',color:sc[item.status]?.text||'#64748b',textTransform:'capitalize'}}>{item.status}</span>
                </div>
              </div>
              {item.finance_remark && <div style={{background:'#f0fdf4',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'13px',color:'#16a34a',fontWeight:'500'}}>✅ Finance Note: {item.finance_remark}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                <div>
                  <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>UTR Number *</label>
                  <input value={utr[item.id]||item.utr_number||''} onChange={e=>setUtr(p=>({...p,[item.id]:e.target.value}))} placeholder='Enter UTR / transaction number' style={inp()} />
                </div>
                <div>
                  <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Upload Payment Slip</label>
                  <div style={{border:'1.5px dashed #e5e7eb',borderRadius:'10px',padding:'10px',textAlign:'center',cursor:'pointer'}}>
                    <input type='file' accept='.pdf,.jpg,.jpeg,.png' onChange={e=>setSlip(p=>({...p,[item.id]:e.target.files[0]}))} style={{display:'none'}} id={'slip_'+item.id} />
                    <label htmlFor={'slip_'+item.id} style={{cursor:'pointer',fontSize:'12px',color:'#7c3aed',fontWeight:'600'}}>{slip[item.id]?'✅ '+slip[item.id].name:item.payment_slip_url?'✅ Slip already uploaded':'📎 Click to upload slip'}</label>
                  </div>
                </div>
              </div>
              {item.payment_slip_url && (
                <div style={{marginBottom:'14px'}}>
                  <a href={item.payment_slip_url} target='_blank' rel='noopener noreferrer' style={{fontSize:'12px',color:'#7c3aed',fontWeight:'600',textDecoration:'none'}}>📎 View uploaded payment slip ↗</a>
                </div>
              )}
              <div style={{display:'flex',gap:'10px'}}>
                {item.status!=='processing' && <button onClick={()=>markProcessing(item)} style={{padding:'10px 18px',borderRadius:'10px',background:'#dbeafe',color:'#1d4ed8',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>Mark Processing</button>}
                <button onClick={()=>markPaid(item)} disabled={updating[item.id]} style={{flex:1,padding:'10px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>{updating[item.id]?'Processing...':'✅ Mark as Paid'}</button>
                {item.invoice?.invoice_file_url && <a href={item.invoice.invoice_file_url} target='_blank' rel='noopener noreferrer' style={{padding:'10px 14px',borderRadius:'10px',background:'#f1f5f9',color:'#374151',fontSize:'12px',fontWeight:'600',border:'1px solid #e5e7eb',textDecoration:'none',whiteSpace:'nowrap'}}>📎 Invoice</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAID TAB - WITH MULTI SELECT + EXPORT */}
      {tab==='paid' && !loading && (
        <div>
          {paidItems.length===0 && <div style={{background:'white',borderRadius:'16px',padding:'50px',textAlign:'center',border:'1px solid #f1f5f9'}}><p style={{color:'#94a3b8',margin:0}}>No paid invoices yet.</p></div>}
          {paidItems.length>0 && (
            <>
              <div style={{background:'white',borderRadius:'12px',padding:'14px 20px',marginBottom:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <input type='checkbox' checked={selected.length===paidItems.length} onChange={()=>toggleAll(paidItems)} style={{width:'18px',height:'18px',cursor:'pointer',accentColor:'#7c3aed'}} />
                  <span style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>
                    {selected.length===0 ? `Select All (${paidItems.length} invoices)` : `${selected.length} of ${paidItems.length} selected`}
                  </span>
                </div>
                {selected.length>0 && (
                  <button onClick={exportSelected} style={{padding:'8px 18px',borderRadius:'10px',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>
                    📥 Export Selected ({selected.length}) to Excel
                  </button>
                )}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {paidItems.map(item=>(
                  <div key={item.id} style={{background:'white',borderRadius:'14px',padding:'20px 24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:selected.includes(item.id)?'2px solid #7c3aed':'1px solid #f1f5f9',transition:'border 0.15s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
                      <input type='checkbox' checked={selected.includes(item.id)} onChange={()=>toggleSelect(item.id)} style={{width:'18px',height:'18px',cursor:'pointer',accentColor:'#7c3aed',flexShrink:0}} />
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                          <div>
                            <p style={{fontSize:'14px',fontWeight:'700',color:'#0f172a',margin:0}}>{item.invoice?.vendor_name}</p>
                            <p style={{fontSize:'12px',color:'#64748b',margin:'2px 0 0'}}>{item.invoice?.invoice_number} • {item.invoice?.location||'-'}</p>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <p style={{fontSize:'16px',fontWeight:'800',color:'#0f172a',margin:0}}>Rs. {Number(item.invoice?.total_amount||0).toLocaleString()}</p>
                            <span style={{fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'10px',background:'#dcfce7',color:'#16a34a'}}>Paid</span>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',background:'#f8fafc',borderRadius:'8px',padding:'10px',marginBottom:'12px'}}>
                          {item.status==='paid' && item.workflow && (
                            <div style={{gridColumn:'1 / -1',marginBottom:'10px',padding:'10px 12px',background:'#f0fdf4',borderRadius:'8px',border:'1px solid #bbf7d0'}}>
                              <p style={{fontSize:'11px',fontWeight:'700',color:'#16a34a',textTransform:'uppercase',margin:'0 0 6px'}}>Approved By</p>
                              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                                {[1,2,3].map(s=>(
                                  <span key={s} style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'12px',background: (item.workflow['approver_'+s+'_status']==='approved') ? '#dcfce7' : '#f1f5f9', color: (item.workflow['approver_'+s+'_status']==='approved') ? '#16a34a' : '#94a3b8'}}>{(item.approverNames && item.approverNames[s]) || ('Approver '+s)}{(item.workflow['approver_'+s+'_status']==='approved') ? ' ✓' : ''}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {[['Invoice Date',item.invoice?.invoice_date||'-'],['GST Number',item.invoice?.gst_number||'-'],['UTR Number',item.utr_number||'—'],['Payment Date',item.payment_date||'-']].map(([k,v])=>(
                            <div key={k}><p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p><p style={{fontSize:'12px',fontWeight:'700',color:'#334155',margin:'2px 0 0'}}>{v}</p></div>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          {item.payment_slip_url && (
                            <a href={item.payment_slip_url} target='_blank' rel='noopener noreferrer' style={{padding:'7px 14px',borderRadius:'8px',background:'#dcfce7',color:'#16a34a',fontSize:'12px',fontWeight:'600',textDecoration:'none'}}>📎 Payment Slip</a>
                          )}
                          {item.invoice?.invoice_file_url && (
                            <a href={item.invoice.invoice_file_url} target='_blank' rel='noopener noreferrer' style={{padding:'7px 14px',borderRadius:'8px',background:'#f1f5f9',color:'#374151',fontSize:'12px',fontWeight:'600',textDecoration:'none'}}>📄 Invoice</a>
                          )}
                          {item.utr_number && (
                            <span style={{padding:'7px 14px',borderRadius:'8px',background:'#ede9fe',color:'#7c3aed',fontSize:'12px',fontWeight:'600'}}>UTR: {item.utr_number}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* REJECTED TAB */}
      {tab==='rejected' && !loading && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {rejected.length===0 && <div style={{background:'white',borderRadius:'16px',padding:'50px',textAlign:'center',border:'1px solid #f1f5f9'}}><p style={{color:'#94a3b8',margin:0}}>No rejected invoices.</p></div>}
          {rejected.map(inv=>(
            <div key={inv.id} style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'2px solid #fee2e2'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                <div>
                  <p style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',margin:0}}>{inv.vendor_name||'Unknown Vendor'}</p>
                  <p style={{fontSize:'13px',color:'#64748b',margin:'3px 0 0'}}>{inv.invoice_number} • {inv.location||'-'}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{fontSize:'16px',fontWeight:'800',color:'#0f172a',margin:0}}>Rs. {Number(inv.total_amount||0).toLocaleString()}</p>
                  <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',background:'#fee2e2',color:'#dc2626'}}>{inv.rejection_source==='finance'?'Rejected by Finance':'Rejected by Approver'}</span>
                </div>
              </div>
              {inv.rejection_remark && (
                <div style={{background:'#fef2f2',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'13px',color:'#dc2626',fontWeight:'500'}}>❌ Reason: {inv.rejection_remark}</div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',background:'#f8fafc',borderRadius:'10px',padding:'12px',marginBottom:'16px'}}>
                {[['Invoice Date',inv.invoice_date||'-'],['GST',inv.gst_number||'-'],['Confidence',(inv.confidence_score||0)+'%']].map(([k,v])=>(
                  <div key={k}><p style={{fontSize:'11px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{k}</p><p style={{fontSize:'13px',fontWeight:'700',color:'#334155',margin:'2px 0 0'}}>{v}</p></div>
                ))}
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>startEdit(inv)} style={{flex:1,padding:'10px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>✏️ Edit & Resubmit</button>
                <button onClick={()=>handleDelete(inv)} style={{padding:'10px 18px',borderRadius:'10px',background:'#fee2e2',color:'#dc2626',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>🗑️ Delete</button>
                {inv.invoice_file_url && <a href={inv.invoice_file_url} target='_blank' rel='noopener noreferrer' style={{padding:'10px 14px',borderRadius:'10px',background:'#f1f5f9',color:'#374151',fontSize:'12px',fontWeight:'600',border:'1px solid #e5e7eb',textDecoration:'none'}}>📎 View</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}