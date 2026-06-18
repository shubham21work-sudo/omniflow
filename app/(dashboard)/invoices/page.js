'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { extractInvoiceFields } from '../../../lib/ocrParser';
import { computeConfidence } from '../../../lib/aiMatching';
import { createNotification } from '../../../lib/notify';

export default function InvoicesPage() {
  const [step, setStep] = useState('upload');
  const [extracted, setExtracted] = useState(null);
  const [scores, setScores] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase.from('vendors').select('*');
      const { data: a } = await supabase.from('agreements').select('*');
      setVendors(v || []);
      setAgreements(a || []);
    })();
  }, []);

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setStep('processing'); setMsg('');
    try {
      const fileName = Date.now() + '_' + selectedFile.name;
      const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, selectedFile);
      let fileUrl = '';
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }
      const formData = new FormData();
      formData.append('file', selectedFile);
      const ocrRes = await fetch('/api/ocr', { method: 'POST', body: formData });
      const ocrData = await ocrRes.json();
      const rawText = ocrData.rawText || '';
      const aiRes = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawText }) });
      const fields = await aiRes.json();
      const gstPattern = /^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
      if (!fields.gst_number || !gstPattern.test(fields.gst_number)) {
        const regexFields = extractInvoiceFields(rawText);
        if (regexFields.gst_number) fields.gst_number = regexFields.gst_number;
      }
      fields.invoice_file_url = fileUrl;
      try { const catRes = await fetch('/api/categorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorName: fields.vendor_name, rawText }) }); const catData = await catRes.json(); fields.category = catData.category || 'Other'; fields.remark = catData.remark || ''; } catch (e) { fields.category = 'Other'; fields.remark = ''; }
      const matchResult = computeConfidence({ extracted: fields, vendors, agreements });
      setExtracted(fields); setScores(matchResult); setStep('review');
    } catch (err) { setMsg('Error: ' + err.message); setStep('upload'); }
  };

  const f = (k, v) => setExtracted(p => ({...p, [k]: v}));

  const handleSave = async () => {
    setSaving(true);
    const invNum = extracted.invoice_number;
      if (invNum) {
        const { data: dupes } = await supabase.from('invoices').select('id,status').eq('invoice_number', invNum);
        const dupeIds = (dupes || []).map(d => d.id);
        let blockedPaid = false;
        if (dupeIds.length > 0) {
          const { data: fqPaid } = await supabase.from('finance_queue').select('id').in('invoice_id', dupeIds).eq('status', 'paid');
          if (fqPaid && fqPaid.length > 0) blockedPaid = true;
        }
        const blockedApproved = (dupes || []).some(d => d.status === 'approved');
        if (blockedApproved || blockedPaid) {
          setSaving(false);
          setMsg('Error: Invoice ' + invNum + ' already exists and is already approved or paid. Duplicate submission blocked.');
          return;
        }
      }
      const status = scores.confidence >= 95 ? 'pending_approval' : 'review';
    const { data, error } = await supabase.from('invoices').insert([{
      vendor_id: scores.matchedVendor ? scores.matchedVendor.id : null,
      agreement_id: scores.matchedAgreement ? scores.matchedAgreement.id : null,
      invoice_number: extracted.invoice_number,
      category: extracted.category || 'Other',
      remark: extracted.remark || '',
      invoice_date: extracted.invoice_date || null,
      vendor_name: extracted.vendor_name,
      gst_number: extracted.gst_number,
      location: extracted.location,
      base_amount: parseFloat(extracted.base_amount)||0,
      gst_amount: parseFloat(extracted.gst_amount)||0,
      total_amount: parseFloat(extracted.total_amount)||0,
      invoice_file_url: extracted.invoice_file_url,
      vendor_match_score: scores.vendorMatch,
      gst_match_score: scores.gstMatch,
      agreement_active_score: scores.amountCheck,
      completeness_score: scores.completeness,
      confidence_score: scores.confidence,
      status,
    }]).select();
    if (error) { setMsg('Error: ' + error.message); setSaving(false); return; }
    if (status === 'pending_approval' && data && data[0]) {
      const wf = await supabase.from('approval_workflow').insert([{ invoice_id: data[0].id, current_stage: 1 }]);
      const { data: approvers } = await supabase.from('approver_settings').select('*').eq('stage', 1).single();
      if (approvers) {
        await createNotification(approvers.email, 'New invoice for approval', 'Invoice ' + (data[0].invoice_number || 'N/A') + ' from ' + (data[0].vendor_name || 'a vendor') + ' for Rs. ' + Number(data[0].total_amount || 0).toLocaleString('en-IN') + ' has been submitted and needs your approval (Stage 1).', '/approvals', data[0].id);
          const _notifyOld = (false) && fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: approvers.email,
            approverName: approvers.name,
            invoiceNumber: extracted.invoice_number || 'N/A',
            vendorName: extracted.vendor_name || 'N/A',
            amount: Number(extracted.total_amount || 0).toLocaleString(),
            stage: 1,
            appUrl: window.location.origin,
          }),
        });
      }
    }
    setSaving(false);
    setMsg(status==='pending_approval' ? 'Invoice saved! Approver 1 has been notified by email.' : 'Saved for manual review.');
    setSaved(true);
  };

  const reset = () => { setExtracted(null); setScores(null); setStep('upload'); setMsg(''); setSaved(false); };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Invoices</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Upload an invoice — AI extracts and validates automatically</p>
      </div>
      {step==='upload' && (
        <div onDrop={(e)=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={(e)=>e.preventDefault()} style={{background:'white',borderRadius:'16px',border:'2px dashed #c4b5fd',padding:'60px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>📄</div>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#0f172a',marginBottom:'6px'}}>Drag and drop your invoice here</p>
          <p style={{fontSize:'13px',color:'#94a3b8',marginBottom:'20px'}}>Supports PDF, JPG, PNG</p>
          <label style={{display:'inline-block',padding:'12px 28px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>Browse Files<input type='file' accept='.pdf,.jpg,.jpeg,.png' onChange={(e)=>handleFile(e.target.files[0])} style={{display:'none'}} /></label>
        </div>
      )}
      {step==='processing' && (
        <div style={{background:'white',borderRadius:'16px',padding:'60px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{width:'48px',height:'48px',border:'3px solid #e5e7eb',borderTopColor:'#7c3aed',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 20px'}}></div>
          <p style={{color:'#64748b',fontSize:'14px',fontWeight:'500'}}>Reading invoice with OCR and AI...</p>
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}
      {step==='review' && extracted && scores && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',alignItems:'start'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>Extracted Details (Review and Edit)</h3>
            {[['vendor_name','Vendor Name'],['invoice_number','Invoice Number'],['invoice_date','Invoice Date'],['gst_number','GST Number'],['base_amount','Amount Without GST'],['gst_amount','GST Amount'],['total_amount','Invoice Total'],['location','Location / Branch']].map(([key,label])=>(
              <div key={key} style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>{label}</label>
                <input value={extracted[key]||''} onChange={e=>f(key,e.target.value)} style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827'}} />
              </div>
            ))}
            <button onClick={reset} style={{width:'100%',padding:'11px',borderRadius:'10px',background:'#f1f5f9',color:'#475569',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>Upload a different file</button>
          </div>
          <div style={{background:'white',borderRadius:'16px',padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'20px'}}>AI Validation Result</h3>
            <div style={{marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <span style={{fontSize:'13px',fontWeight:'600',color:'#374151'}}>Confidence Score</span>
                <span style={{fontSize:'20px',fontWeight:'800',color:scores.confidence>=95?'#16a34a':scores.confidence>=80?'#d97706':'#dc2626'}}>{scores.confidence}%</span>
              </div>
              <div style={{height:'10px',background:'#f1f5f9',borderRadius:'100px',overflow:'hidden'}}>
                <div style={{height:'100%',width:scores.confidence+'%',background:scores.confidence>=95?'linear-gradient(90deg,#10b981,#16a34a)':scores.confidence>=80?'linear-gradient(90deg,#f59e0b,#d97706)':'linear-gradient(90deg,#ef4444,#dc2626)',borderRadius:'100px',transition:'width 1s ease'}}></div>
              </div>
              <p style={{fontSize:'12px',color:scores.confidence>=95?'#16a34a':'#dc2626',fontWeight:'600',marginTop:'8px'}}>{scores.confidence>=95?'Threshold met — Approver 1 will be notified':'Below 95% — needs manual review'}</p>
            </div>
            {[['Vendor Match',scores.vendorMatch],['GST Match',scores.gstMatch],['Amount Check',scores.amountCheck],['Completeness',scores.completeness]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f8fafc'}}>
                <span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.04em'}}>{k}</span>
                <span style={{fontSize:'13px',fontWeight:'700',color:v===100?'#16a34a':v===0?'#dc2626':'#d97706'}}>{v}%</span>
              </div>
            ))}
            {scores.matchedVendor && <p style={{fontSize:'12px',color:'#64748b',marginTop:'12px'}}>Matched Vendor: {scores.matchedVendor.name}</p>}
            {!scores.matchedVendor && <p style={{fontSize:'12px',color:'#dc2626',marginTop:'12px'}}>No matching vendor found in records</p>}
              {extracted.remark && <div style={{marginTop:'14px',padding:'12px 14px',borderRadius:'10px',background:'#faf5ff',border:'1px solid #e9d5ff'}}><p style={{fontSize:'11px',fontWeight:'700',color:'#7c3aed',textTransform:'uppercase',letterSpacing:'0.04em',margin:'0 0 4px'}}>AI Remark</p><p style={{fontSize:'13px',color:'#475569',margin:0,lineHeight:'1.5'}}>{extracted.remark}</p>{extracted.category && <span style={{display:'inline-block',marginTop:'8px',fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'12px',background:'#ede9fe',color:'#6d28d9'}}>{extracted.category}</span>}</div>}
            {msg && <div style={{marginTop:'16px',padding:'12px',borderRadius:'10px',background:msg.includes('Error')?'#fee2e2':'#dcfce7',color:msg.includes('Error')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600'}}>{msg}</div>}
            {!saved && <button onClick={handleSave} disabled={saving} style={{width:'100%',marginTop:'16px',padding:'13px',borderRadius:'10px',background:scores.confidence>=95?'linear-gradient(135deg,#10b981,#059669)':'linear-gradient(135deg,#f59e0b,#d97706)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>{saving?'Saving...':scores.confidence>=95?'Send for Approval':'Save for Review'}</button>}
            {saved && scores.confidence>=95 && <button onClick={()=>window.location.href='/approvals'} style={{width:'100%',marginTop:'12px',padding:'13px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer'}}>Go to Approvals</button>}
          </div>
        </div>
      )}
    </div>
  );
}