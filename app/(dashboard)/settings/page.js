'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ADMIN_EMAIL } from '../../../lib/config';

export default function SettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [approvers, setApprovers] = useState([{stage:1,name:'',email:''},{stage:2,name:'',email:''},{stage:3,name:'',email:''}]);
  const [finance, setFinance] = useState({name:'',email:''});
  const [saving, setSaving] = useState(false);
  const [savingFin, setSavingFin] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgFin, setMsgFin] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data?.session?.user?.email || '';
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        router.replace('/dashboard');
        return;
      }
      setAuthorized(true);
      setCheckingAuth(false);
      const { data: ap } = await supabase.from('approver_settings').select('*').order('stage');
      if (ap && ap.length>0) setApprovers([ap.find(a=>a.stage===1)||{stage:1,name:'',email:''},ap.find(a=>a.stage===2)||{stage:2,name:'',email:''},ap.find(a=>a.stage===3)||{stage:3,name:'',email:''}]);
      const { data: fd } = await supabase.from('finance_settings').select('*').limit(1);
      if (fd && fd[0]) setFinance({name:fd[0].name,email:fd[0].email});
    })();
  }, [router]);

  const updateApprover = (stage,key,val) => setApprovers(p=>p.map(a=>a.stage===stage?{...a,[key]:val}:a));

  const saveApprovers = async () => {
    setSaving(true); setMsg('');
    for (const a of approvers) {
      if (!a.name||!a.email) continue;
      await supabase.from('approver_settings').upsert({stage:a.stage,name:a.name,email:a.email},{onConflict:'stage'});
    }
    setSaving(false); setMsg('Approver settings saved!');
  };

  const saveFinance = async () => {
    if (!finance.name||!finance.email) { setMsgFin('Name and email required.'); return; }
    setSavingFin(true); setMsgFin('');
    await supabase.from('finance_settings').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await supabase.from('finance_settings').insert([{name:finance.name,email:finance.email}]);
    setSavingFin(false); setMsgFin('Finance member saved!');
  };

  const inp = {width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827'};
  const stageColor = ['','linear-gradient(135deg,#7c3aed,#4f46e5)','linear-gradient(135deg,#10b981,#059669)','linear-gradient(135deg,#f59e0b,#d97706)'];

  if (checkingAuth) {
    return <div style={{textAlign:'center',padding:'80px',color:'#94a3b8',fontSize:'14px'}}>Checking access...</div>;
  }
  if (!authorized) { return null; }

  return (
    <div style={{maxWidth:'680px'}}>
      <div style={{marginBottom:'28px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Settings</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Configure approvers and finance member</p>
      </div>

      <div style={{background:'#fef9c3',border:'1px solid #fde047',borderRadius:'12px',padding:'14px 18px',marginBottom:'28px'}}>
        <p style={{fontSize:'13px',color:'#854d0e',fontWeight:'600',margin:0}}>Each person must sign up at /signup with the email entered below. The system routes invoices automatically based on login email.</p>
      </div>

      <h3 style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'16px'}}>3-Stage Approvers</h3>
      {approvers.map((a,i)=>(
        <div key={a.stage} style={{background:'white',borderRadius:'16px',padding:'20px 24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',marginBottom:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'8px',background:stageColor[a.stage],display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'14px'}}>{a.stage}</div>
            <div>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#0f172a',margin:0}}>Stage {a.stage} Approver</p>
              <p style={{fontSize:'11px',color:'#64748b',margin:0}}>{i===0?'First reviewer':i===1?'Second reviewer':'Final approver - Finance Queue'}</p>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'5px'}}>Full Name</label>
              <input value={a.name} onChange={e=>updateApprover(a.stage,'name',e.target.value)} placeholder='e.g. Rahul Sharma' style={inp} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'5px'}}>Email Address</label>
              <input type='email' value={a.email} onChange={e=>updateApprover(a.stage,'email',e.target.value)} placeholder='approver@company.com' style={inp} />
            </div>
          </div>
        </div>
      ))}
      {msg && <div style={{padding:'10px 14px',borderRadius:'10px',background:'#dcfce7',color:'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>{msg}</div>}
      <button onClick={saveApprovers} disabled={saving} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer',marginBottom:'32px'}}>{saving?'Saving...':'Save Approver Settings'}</button>

      <h3 style={{fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'16px'}}>Finance Member</h3>
      <div style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#0ea5e9,#0284c7)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'14px'}}>F</div>
          <div>
            <p style={{fontSize:'13px',fontWeight:'700',color:'#0f172a',margin:0}}>Finance Verifier</p>
            <p style={{fontSize:'11px',color:'#64748b',margin:0}}>Verifies invoices after 3-stage approval - marks paid with UTR</p>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'5px'}}>Full Name</label>
            <input value={finance.name} onChange={e=>setFinance(p=>({...p,name:e.target.value}))} placeholder='e.g. Priya Mehta' style={inp} />
          </div>
          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#374151',marginBottom:'5px'}}>Email Address</label>
            <input type='email' value={finance.email} onChange={e=>setFinance(p=>({...p,email:e.target.value}))} placeholder='finance@company.com' style={inp} />
          </div>
        </div>
      </div>
      {msgFin && <div style={{padding:'10px 14px',borderRadius:'10px',background:msgFin.includes('required')?'#fee2e2':'#dcfce7',color:msgFin.includes('required')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>{msgFin}</div>}
      <button onClick={saveFinance} disabled={savingFin} style={{width:'100%',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,#0ea5e9,#0284c7)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer'}}>{savingFin?'Saving...':'Save Finance Member'}</button>
    </div>
  );
}