'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! I am your OmniFlow assistant. Ask me anything about your invoices, vendors, approvals, or spending.' }]);
  const [loading, setLoading] = useState(false);

  const buildSnapshot = async () => {
    const [inv, ven, agr, appr, fin] = await Promise.all([
      supabase.from('invoices').select('*'),
      supabase.from('vendors').select('*'),
      supabase.from('agreements').select('*'),
      supabase.from('approvals').select('*'),
      supabase.from('finance_queue').select('*'),
    ]);
    return {
      invoices: inv.data || [],
      vendors: ven.data || [],
      agreements: agr.data || [],
      approvals: appr.data || [],
      finance: fin.data || [],
    };
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    const newMsgs = [...messages, { role: 'user', content: q }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const snapshot = await buildSnapshot();
      const history = newMsgs.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, snapshot, history }) });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.answer || 'No response.' }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      {!open && (
        <button onClick={()=>setOpen(true)} style={{position:'fixed',bottom:'24px',right:'24px',width:'60px',height:'60px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',border:'none',boxShadow:'0 8px 24px rgba(124,58,237,0.4)',cursor:'pointer',fontSize:'24px',zIndex:1000}}>AI</button>
      )}
      {open && (
        <div style={{position:'fixed',bottom:'24px',right:'24px',width:'380px',maxWidth:'calc(100vw - 32px)',height:'560px',maxHeight:'calc(100vh - 48px)',background:'white',borderRadius:'18px',boxShadow:'0 12px 48px rgba(0,0,0,0.25)',display:'flex',flexDirection:'column',zIndex:1000,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{color:'white',fontWeight:'700',fontSize:'15px',margin:0}}>OmniFlow Assistant</p>
              <p style={{color:'#ddd6fe',fontSize:'11px',margin:'2px 0 0'}}>Ask about your invoices and vendors</p>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',width:'28px',height:'28px',borderRadius:'8px',cursor:'pointer',fontSize:'16px'}}>X</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px',background:'#f8fafc'}}>
            {messages.map((m,i)=>(
              <div key={i} style={{alignSelf: m.role==='user'?'flex-end':'flex-start',maxWidth:'85%',background: m.role==='user'?'linear-gradient(135deg,#7c3aed,#4f46e5)':'white',color: m.role==='user'?'white':'#1e293b',padding:'10px 14px',borderRadius:'14px',fontSize:'13px',lineHeight:'1.5',whiteSpace:'pre-wrap',border: m.role==='user'?'none':'1px solid #e5e7eb'}}>{m.content}</div>
            ))}
            {loading && <div style={{alignSelf:'flex-start',color:'#94a3b8',fontSize:'13px'}}>Thinking...</div>}
          </div>
          <div style={{padding:'12px',borderTop:'1px solid #e5e7eb',display:'flex',gap:'8px'}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} placeholder='Ask something...' style={{flex:1,padding:'10px 14px',borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none'}} />
            <button onClick={send} disabled={loading} style={{padding:'10px 18px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',border:'none',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}