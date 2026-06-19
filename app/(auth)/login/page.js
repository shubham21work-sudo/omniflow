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
  const [focus, setFocus] = useState('');

  const handleLogin = async () => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/dashboard');
  };

  const input = (k) => ({ width:'100%', padding:'13px 15px', borderRadius:'12px', border:'1.5px solid ' + (focus===k ? '#4F46E5' : '#E5E7EB'), fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827', transition:'border 0.15s', boxShadow: focus===k ? '0 0 0 4px rgba(79,70,229,0.10)' : 'none' });
  const label = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'7px' };

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:'Inter, system-ui, sans-serif',background:'#FFFFFF'}}>

      <div className='auth-brand' style={{flex:'1',background:'linear-gradient(150deg, #4F46E5 0%, #4338CA 45%, #1E1B4B 100%)',padding:'56px 52px',display:'flex',flexDirection:'column',justifyContent:'space-between',position:'relative',overflow:'hidden'}}>
        <div style={{position:'relative',zIndex:2}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'46px',height:'46px',borderRadius:'13px',background:'rgba(255,255,255,0.16)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:'800',color:'white'}}>O</div>
            <div>
              <p style={{color:'white',fontWeight:'700',fontSize:'19px',margin:0}}>OmniFlow</p>
              <p style={{color:'#C7D2FE',fontSize:'12px',margin:0}}>AI Invoice Platform</p>
            </div>
          </div>
        </div>
        <div style={{position:'relative',zIndex:2}}>
          <h2 style={{color:'white',fontSize:'34px',fontWeight:'800',lineHeight:'1.2',margin:'0 0 18px'}}>OmniFlow<br/>Powered by Leap.</h2>
          <p style={{color:'#C7D2FE',fontSize:'15px',lineHeight:'1.6',margin:'0 0 28px',maxWidth:'380px'}}>Upload, validate, route and pay every vendor invoice with AI doing the heavy lifting end to end.</p>
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'11px',color:'white',fontSize:'14px'}}><span style={{width:'22px',height:'22px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}>✓</span> OCR + AI field extraction</div>
            <div style={{display:'flex',alignItems:'center',gap:'11px',color:'white',fontSize:'14px'}}><span style={{width:'22px',height:'22px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}>✓</span> 3-stage automated approvals</div>
            <div style={{display:'flex',alignItems:'center',gap:'11px',color:'white',fontSize:'14px'}}><span style={{width:'22px',height:'22px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}>✓</span> Voice AI assistant</div>
          </div>
        </div>
        <p style={{color:'#A5B4FC',fontSize:'12px',margin:0,position:'relative',zIndex:2}}>Trusted invoice automation</p>
        <div style={{position:'absolute',top:'-80px',right:'-80px',width:'320px',height:'320px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}></div>
        <div style={{position:'absolute',bottom:'-60px',right:'40px',width:'200px',height:'200px',borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}></div>
      </div>

      <div style={{flex:'1',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 28px'}}>
        <div style={{width:'100%',maxWidth:'400px'}}>
          <h1 style={{color:'#0F172A',fontSize:'28px',fontWeight:'800',margin:'0 0 8px'}}>Welcome back</h1>
          <p style={{color:'#64748B',fontSize:'14px',margin:'0 0 30px'}}>Sign in to your OmniFlow account</p>

          <div style={{marginBottom:'18px'}}>
            <label style={label}>Email Address</label>
            <input type='email' value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocus('email')} onBlur={()=>setFocus('')} placeholder='you@company.com' style={input('email')} />
          </div>
          <div style={{marginBottom:'10px'}}>
            <label style={label}>Password</label>
            <input type='password' value={password} onChange={e=>setPassword(e.target.value)} onFocus={()=>setFocus('pw')} onBlur={()=>setFocus('')} placeholder='Enter your password' style={input('pw')} />
          </div>
          {error && <p style={{color:'#DC2626',fontSize:'13px',fontWeight:'600',margin:'8px 0 0'}}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{width:'100%',padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg, #4F46E5, #4338CA)',color:'white',fontSize:'15px',fontWeight:'700',border:'none',cursor:'pointer',marginTop:'20px',marginBottom:'18px',boxShadow:'0 10px 24px rgba(79,70,229,0.30)'}}>{loading?'Signing in...':'Sign In'}</button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#6B7280',margin:0}}>Do not have an account? <a href='/signup' style={{color:'#4F46E5',fontWeight:'700',textDecoration:'none'}}>Sign up</a></p>
        </div>
      </div>
    </div>
  );
}  