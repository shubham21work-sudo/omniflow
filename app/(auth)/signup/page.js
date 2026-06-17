'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    setMsg('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin + '/login',
      },
    });
    setLoading(false);

    if (error) { setError(error.message); return; }
    if (data.session) {
      router.push('/dashboard');
    } else {
      setMsg('Account created! Check your email and click the verification link, then sign in.');
    }
  };

  const inputStyle = { width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' };
  const labelStyle = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'420px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'16px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'22px',fontWeight:'800',color:'white'}}>O</div>
          <h1 style={{color:'white',fontSize:'26px',fontWeight:'700',margin:'0 0 8px'}}>Create account</h1>
          <p style={{color:'#94a3b8',fontSize:'14px',margin:0}}>Start using OmniFlow today</p>
        </div>
        <div style={{background:'white',borderRadius:'20px',padding:'32px',boxShadow:'0 25px 50px rgba(0,0,0,0.4)'}}>
          <div style={{marginBottom:'16px'}}>
            <label style={labelStyle}>Full Name</label>
            <input type='text' value={name} onChange={e=>setName(e.target.value)} placeholder='Your full name' style={inputStyle} />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={labelStyle}>Email Address</label>
            <input type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder='you@company.com' style={inputStyle} />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={labelStyle}>Password</label>
            <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='Create a password (min 6 chars)' style={inputStyle} />
          </div>
          <div style={{marginBottom:'10px'}}>
            <label style={labelStyle}>Confirm Password</label>
            <input type='password' value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder='Re-enter your password' style={inputStyle} />
          </div>
          {error && <p style={{color:'#dc2626',fontSize:'13px',fontWeight:'600',marginBottom:'14px'}}>{error}</p>}
          {msg && <p style={{color:'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'14px'}}>{msg}</p>}
          <button onClick={handleSignup} disabled={loading} style={{width:'100%',padding:'13px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer',marginTop:'10px',marginBottom:'16px'}}>{loading?'Creating account...':'Create Account'}</button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#6b7280',margin:0}}>Already have an account? <a href='/login' style={{color:'#7c3aed',fontWeight:'600',textDecoration:'none'}}>Sign in</a></p>
        </div>
      </div>
    </div>
  );
}