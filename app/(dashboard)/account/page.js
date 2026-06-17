'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const u = data.session.user;
        setUser(u);
        setEmail(u.email || '');
        setFullName(u.user_metadata?.full_name || '');
      }
    });
  }, []);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileMsg('');
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSavingProfile(false);
    if (error) setProfileMsg('Error: ' + error.message);
    else setProfileMsg('Profile updated successfully!');
  };

  const handlePasswordChange = async () => {
    setPasswordMsg('');
    if (!newPassword || newPassword.length < 6) { setPasswordMsg('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('Passwords do not match.'); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) setPasswordMsg('Error: ' + error.message);
    else { setPasswordMsg('Password changed successfully!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
  };

  const initial = email ? email[0].toUpperCase() : 'U';
  const cardStyle = { background:'white', borderRadius:'16px', padding:'28px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9', marginBottom:'24px' };
  const labelStyle = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };
  const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#111827' };
  const btnStyle = (color) => ({ padding:'11px 24px', borderRadius:'10px', background:color, color:'white', fontSize:'13px', fontWeight:'600', border:'none', cursor:'pointer' });

  return (
    <div style={{maxWidth:'640px'}}>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>My Account</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Manage your profile and password</p>
      </div>

      <div style={cardStyle}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:'700',flexShrink:0}}>{initial}</div>
          <div>
            <p style={{fontSize:'16px',fontWeight:'700',color:'#0f172a',margin:0}}>{fullName || 'No name set'}</p>
            <p style={{fontSize:'13px',color:'#64748b',margin:'4px 0 0'}}>{email}</p>
            <span style={{fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'20px',background:'#ede9fe',color:'#7c3aed',display:'inline-block',marginTop:'6px'}}>Active Account</span>
          </div>
        </div>

        <h3 style={{fontSize:'14px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Profile Information</h3>
        <div style={{marginBottom:'16px'}}>
          <label style={labelStyle}>Full Name</label>
          <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder='Your full name' style={inputStyle} />
        </div>
        <div style={{marginBottom:'20px'}}>
          <label style={labelStyle}>Email Address</label>
          <input value={email} disabled style={{...inputStyle, background:'#f8fafc', color:'#94a3b8', cursor:'not-allowed'}} />
          <p style={{fontSize:'12px',color:'#94a3b8',margin:'6px 0 0'}}>Email cannot be changed here.</p>
        </div>
        {profileMsg && <div style={{padding:'10px 14px',borderRadius:'10px',background:profileMsg.includes('Error')?'#fee2e2':'#dcfce7',color:profileMsg.includes('Error')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{profileMsg}</div>}
        <button onClick={handleProfileSave} disabled={savingProfile} style={btnStyle('linear-gradient(135deg,#7c3aed,#4f46e5)')}>{savingProfile?'Saving...':'Save Profile'}</button>
      </div>

      <div style={cardStyle}>
        <h3 style={{fontSize:'14px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Change Password</h3>
        <div style={{marginBottom:'16px'}}>
          <label style={labelStyle}>New Password</label>
          <input type='password' value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder='Enter new password (min 6 chars)' style={inputStyle} />
        </div>
        <div style={{marginBottom:'20px'}}>
          <label style={labelStyle}>Confirm New Password</label>
          <input type='password' value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder='Repeat new password' style={inputStyle} />
        </div>
        {passwordMsg && <div style={{padding:'10px 14px',borderRadius:'10px',background:passwordMsg.includes('Error')||passwordMsg.includes('do not')||passwordMsg.includes('least')?'#fee2e2':'#dcfce7',color:passwordMsg.includes('Error')||passwordMsg.includes('do not')||passwordMsg.includes('least')?'#dc2626':'#16a34a',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>{passwordMsg}</div>}
        <button onClick={handlePasswordChange} disabled={savingPassword} style={btnStyle('linear-gradient(135deg,#0f172a,#1e293b)')}>{savingPassword?'Changing...':'Change Password'}</button>
      </div>

      <div style={{...cardStyle, marginBottom:0}}>
        <h3 style={{fontSize:'14px',fontWeight:'600',color:'#0f172a',marginBottom:'4px'}}>Account Details</h3>
        <p style={{fontSize:'13px',color:'#94a3b8',marginBottom:'16px'}}>Read-only information about your account</p>
        {[['User ID', user?.id?.slice(0,18)+'...'],['Account Created', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '-'],['Last Sign In', user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '-'],['Role','Authenticated User']].map(([k,v])=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f8fafc'}}>
            <span style={{fontSize:'13px',color:'#64748b',fontWeight:'500'}}>{k}</span>
            <span style={{fontSize:'13px',color:'#0f172a',fontWeight:'600'}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}