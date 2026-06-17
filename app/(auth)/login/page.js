'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/dashboard');
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'420px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'16px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'22px',fontWeight:'800',color:'white'}}>O</div>
          <h1 style={{color:'white',fontSize:'26px',fontWeight:'700',margin:'0 0 8px'}}>Welcome back</h1>
          <p style={{color:'#94a3b8',fontSize:'14px',margin:0}}>Sign in to your OmniFlow account</p>
        </div>
        <div style={{background:'white',borderRadius:'20px',padding:'32px',boxShadow:'0 25px 50px rgba(0,0,0,0.4)'}}>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Email Address</label>
            <input type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder='you@company.com' style={{width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827'}} />
          </div>
          <div style={{marginBottom:'10px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Password</label>
            <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='Enter your password' style={{width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#111827'}} />
          </div>
          {error && <p style={{color:'#dc2626',fontSize:'13px',fontWeight:'600',marginBottom:'14px'}}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{width:'100%',padding:'13px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer',marginTop:'10px',marginBottom:'16px'}}>{loading?'Signing in...':'Sign In'}</button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#6b7280',margin:0}}>Do not have an account? <a href='/signup' style={{color:'#7c3aed',fontWeight:'600',textDecoration:'none'}}>Sign up</a></p>
        </div>
      </div>
    </div>
  );
}