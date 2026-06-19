'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function TATAnalyticsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  useEffect(() => { fetchData(); }, []);

  const daysBetween = (a, b) => {
    if (!a || !b) return null;
    const d1 = new Date(a); const d2 = new Date(b);
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.round(((d2 - d1) / (1000*60*60*24)) * 10) / 10;
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    const all = invs || [];
    const ids = all.map(i => i.id);
    let wfMap = {}; let fqMap = {};
    if (ids.length > 0) {
      const { data: wfs } = await supabase.from('approval_workflow').select('*').in('invoice_id', ids);
      (wfs || []).forEach(w => { wfMap[w.invoice_id] = w; });
      const { data: fqs } = await supabase.from('finance_queue').select('*').in('invoice_id', ids);
      (fqs || []).forEach(f => { fqMap[f.invoice_id] = f; });
    }
    const result = all.map(inv => {
      const wf = wfMap[inv.id] || {};
      const fq = fqMap[inv.id] || {};
      const t1 = daysBetween(inv.created_at, wf.approver_1_at);
      const t2 = daysBetween(wf.approver_1_at, wf.approver_2_at);
      const t3 = daysBetween(wf.approver_2_at, wf.approver_3_at);
      const tPay = daysBetween(wf.final_approved_at, fq.payment_date);
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        vendor_name: inv.vendor_name,
        t1, t2, t3, tPay,
        paid: fq.status === 'paid',
      };
    });
    setRows(result);
    setLoading(false);
  };

  const avg = (key) => {
    const vals = rows.map(r => r[key]).filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a,b)=>a+b,0) / vals.length) * 10) / 10;
  };

  const APPROVER_LIMIT = 2;
  const FINANCE_LIMIT = 3;

  const cell = (val, limit) => {
    if (val === null || val === undefined) return { txt:'-', color:'#94a3b8', bg:'transparent' };
    const over = val > limit;
    return { txt: val + 'd', color: over ? '#dc2626' : '#16a34a', bg: over ? '#fee2e2' : '#dcfce7' };
  };

  const generateInsight = async () => {
    setAiLoading(true); setAiText('');
    const summary = {
      avg_approver_1: avg('t1'), avg_approver_2: avg('t2'), avg_approver_3: avg('t3'), avg_payment: avg('tPay'),
      approver_limit_days: APPROVER_LIMIT, finance_limit_days: FINANCE_LIMIT,
      total_invoices: rows.length,
      delayed_payments: rows.filter(r => r.tPay !== null && r.tPay > FINANCE_LIMIT).length,
    };
    try {
      const res = await fetch('/api/tat-insight', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ summary }) });
      const data = await res.json();
      setAiText(data.insight || 'No insight generated.');
    } catch (e) { setAiText('Could not generate insight right now.'); }
    setAiLoading(false);
  };

  const statBox = (label, val, limit) => {
    const over = val !== null && val > limit;
    return (
      <div style={{background:'white',borderRadius:'14px',padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <p style={{fontSize:'12px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',margin:0}}>{label}</p>
        <p style={{fontSize:'26px',fontWeight:'800',color: over ? '#dc2626' : '#0f172a',margin:'6px 0 0'}}>{val===null?'-':val+'d'}</p>
        <p style={{fontSize:'11px',color:'#94a3b8',margin:'2px 0 0'}}>Target: {limit}d</p>
      </div>
    );
  };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>TAT Analytics</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Turn-around time at each stage. Targets: each approver {APPROVER_LIMIT} days, finance {FINANCE_LIMIT} days.</p>
      </div>

      {loading && <p style={{color:'#94a3b8',fontSize:'14px',textAlign:'center',padding:'40px'}}>Loading...</p>}

      {!loading && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'14px',marginBottom:'24px'}}>
            {statBox('Avg Approver 1', avg('t1'), APPROVER_LIMIT)}
            {statBox('Avg Approver 2', avg('t2'), APPROVER_LIMIT)}
            {statBox('Avg Approver 3', avg('t3'), APPROVER_LIMIT)}
            {statBox('Avg Payment', avg('tPay'), FINANCE_LIMIT)}
          </div>

          <div style={{background:'white',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',marginBottom:'24px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
              <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',margin:0}}>AI Insight</h3>
              <button onClick={generateInsight} disabled={aiLoading} style={{padding:'8px 16px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>{aiLoading?'Analyzing...':'Generate AI Insight'}</button>
            </div>
            {aiText ? <p style={{fontSize:'13px',color:'#475569',lineHeight:'1.6',margin:0,whiteSpace:'pre-wrap'}}>{aiText}</p> : <p style={{fontSize:'13px',color:'#94a3b8',margin:0}}>Click the button to let AI analyze your turn-around times and flag bottlenecks.</p>}
          </div>

          <div style={{background:'white',borderRadius:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:'640px'}}>
              <thead>
                <tr style={{borderBottom:'1px solid #f1f5f9',textAlign:'left'}}>
                  {['Invoice','Vendor','Approver 1','Approver 2','Approver 3','Payment'].map(h=>(
                    <th key={h} style={{padding:'12px 16px',fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r=>{
                  const c1=cell(r.t1,APPROVER_LIMIT), c2=cell(r.t2,APPROVER_LIMIT), c3=cell(r.t3,APPROVER_LIMIT), cp=cell(r.tPay,FINANCE_LIMIT);
                  return (
                    <tr key={r.id} style={{borderBottom:'1px solid #f8fafc'}}>
                      <td style={{padding:'12px 16px',fontSize:'13px',fontWeight:'600',color:'#0f172a'}}>{r.invoice_number||'-'}</td>
                      <td style={{padding:'12px 16px',fontSize:'12px',color:'#64748b'}}>{r.vendor_name||'-'}</td>
                      {[c1,c2,c3,cp].map((c,idx)=>(
                        <td key={idx} style={{padding:'12px 16px'}}><span style={{fontSize:'12px',fontWeight:'600',padding:'3px 10px',borderRadius:'12px',background:c.bg,color:c.color}}>{c.txt}</span></td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{fontSize:'12px',color:'#94a3b8',marginTop:'12px'}}>Green = within target, Red = over target. Dash = stage not completed yet. Older invoices may show dashes (timing was added recently).</p>
        </>
      )}
    </div>
  );
}