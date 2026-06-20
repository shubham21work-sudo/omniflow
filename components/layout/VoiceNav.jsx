'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VoiceNav() {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState('');

  const routes = [
    { keys: ['dashboard', 'home'], path: '/dashboard', label: 'Dashboard' },
    { keys: ['invoice', 'invoices', 'upload invoice'], path: '/invoices', label: 'Invoices' },
    { keys: ['active invoice', 'all invoice', 'invoice list'], path: '/invoices/all', label: 'All Invoices' },
    { keys: ['approval', 'approvals', 'approve'], path: '/approvals', label: 'Approvals' },
    { keys: ['finance', 'payment', 'finance queue'], path: '/finance', label: 'Finance Queue' },
    { keys: ['analytics', 'analysis', 'financial'], path: '/analytics', label: 'Analytics' },
    { keys: ['tat', 'tat analytics', 'turn around'], path: '/analytics/tat', label: 'TAT Analytics' },
    { keys: ['vendor', 'vendors', 'upload vendor'], path: '/vendors', label: 'Vendors' },
    { keys: ['active vendor', 'vendor list'], path: '/vendors/active', label: 'Active Vendors' },
    { keys: ['agreement', 'agreements'], path: '/agreements', label: 'Agreements' },
    { keys: ['active agreement'], path: '/agreements/active', label: 'Active Agreements' },
    { keys: ['settings', 'setting'], path: '/settings', label: 'Settings' },
    { keys: ['account', 'my account', 'profile'], path: '/account', label: 'My Account' },
  ];

  const startVoiceNav = () => {
    const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setMsg('Voice not supported. Use Chrome.'); setTimeout(()=>setMsg(''),3000); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => { setListening(true); setMsg('Listening...'); };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setMsg('Try again.'); setTimeout(()=>setMsg(''),2000); };
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase().trim();
      const match = routes.find(r => r.keys.some(k => text.includes(k)));
      if (match) {
        setMsg('Going to ' + match.label + '...');
        setTimeout(() => { router.push(match.path); setMsg(''); }, 700);
      } else {
        setMsg('Not found. Say: dashboard, invoices, approvals...');
        setTimeout(() => setMsg(''), 3000);
      }
    };
    rec.start();
  };

  return (
    <div style={{position:'relative',flexShrink:0}}>
      <button onClick={startVoiceNav} title='Voice Navigation' style={{width:'40px',height:'40px',borderRadius:'10px',background:listening?'#FEE2E2':'#F1F5F9',border:'none',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',color:listening?'#DC2626':'#475569',transition:'all 0.15s'}}>🎙️</button>
      {msg && (
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#0F172A',color:'white',padding:'8px 14px',borderRadius:'10px',fontSize:'12px',fontWeight:'600',whiteSpace:'nowrap',zIndex:200,boxShadow:'0 4px 14px rgba(0,0,0,0.2)'}}>{msg}</div>
      )}
    </div>
  );
}