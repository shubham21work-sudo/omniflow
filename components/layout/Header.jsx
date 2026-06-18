'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import NotificationBell from './NotificationBell';

export default function Header({ user, onMenuClick = () => {} }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const [{ data: invs }, { data: vens }, { data: agrs }] = await Promise.all([
        supabase.from('invoices').select('id,invoice_number,vendor_name,total_amount,status').ilike('vendor_name','%'+query+'%').limit(4),
        supabase.from('vendors').select('id,name,gstin,category').ilike('name','%'+query+'%').limit(3),
        supabase.from('agreements').select('id,agreement_number,vendor_name').ilike('vendor_name','%'+query+'%').limit(3),
      ]);
      const r = [];
      (invs||[]).forEach(i=>r.push({type:'invoice',label:i.invoice_number||'Invoice',sub:i.vendor_name,meta:'Rs. '+Number(i.total_amount||0).toLocaleString(),status:i.status,href:'/invoices'}));
      (vens||[]).forEach(v=>r.push({type:'vendor',label:v.name,sub:v.gstin||'-',meta:v.category,href:'/vendors'}));
      (agrs||[]).forEach(a=>r.push({type:'agreement',label:a.agreement_number||'Agreement',sub:a.vendor_name,href:'/agreements'}));
      setResults(r);
      setShowDropdown(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };
  const initial = user?.email ? user.email[0].toUpperCase() : 'A';
  const displayName = user?.user_metadata?.full_name || user?.email || 'Admin';
  const statusColor = { approved:{bg:'#dcfce7',text:'#16a34a'}, pending_approval:{bg:'#dbeafe',text:'#1d4ed8'}, review:{bg:'#fef9c3',text:'#ca8a04'}, rejected:{bg:'#fee2e2',text:'#dc2626'} };
  const typeIcon = { invoice:'🧾', vendor:'🏢', agreement:'📋' };
  const typeColor = { invoice:'#ede9fe', vendor:'#dcfce7', agreement:'#dbeafe' };

  return (
    <header style={{height:'64px',background:'white',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',gap:'10px',position:'sticky',top:0,zIndex:40}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',flex:1,minWidth:0}}>
        <button className="app-hamburger" onClick={onMenuClick} style={{width:'40px',height:'40px',borderRadius:'10px',background:'#f1f5f9',border:'none',cursor:'pointer',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'18px',color:'#475569'}} aria-label="Open menu">☰</button>

        <div ref={ref} style={{position:'relative',flex:1,maxWidth:'280px',minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f1f5f9',borderRadius:'10px',padding:'8px 14px'}}>
            <span style={{fontSize:'14px',color:'#94a3b8'}}>🔍</span>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              onFocus={()=>{ if (results.length>0) setShowDropdown(true); }}
              placeholder='Search...'
              style={{background:'transparent',border:'none',outline:'none',fontSize:'13px',color:'#475569',width:'100%'}}
            />
            {searching && <span style={{fontSize:'11px',color:'#94a3b8'}}>...</span>}
            {query && <span onClick={()=>{setQuery('');setResults([]);setShowDropdown(false);}} style={{cursor:'pointer',fontSize:'16px',color:'#94a3b8',lineHeight:1}}>×</span>}
          </div>
          {showDropdown && results.length>0 && (
            <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,background:'white',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'1px solid #f1f5f9',zIndex:100,overflow:'hidden',minWidth:'280px'}}>
              {results.map((r,i)=>(
                <div key={i} onClick={()=>{router.push(r.href);setShowDropdown(false);setQuery('');}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',cursor:'pointer',borderBottom:i<results.length-1?'1px solid #f8fafc':'none'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:typeColor[r.type],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{typeIcon[r.type]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'13px',fontWeight:'600',color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.label}</p>
                    <p style={{fontSize:'11px',color:'#94a3b8',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.sub}</p>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px',flexShrink:0}}>
                    {r.meta && <span style={{fontSize:'11px',fontWeight:'600',color:'#475569'}}>{r.meta}</span>}
                    {r.status && <span style={{fontSize:'10px',fontWeight:'600',padding:'2px 6px',borderRadius:'10px',background:statusColor[r.status]?.bg||'#f1f5f9',color:statusColor[r.status]?.text||'#64748b'}}>{r.status}</span>}
                    {!r.status && <span style={{fontSize:'10px',fontWeight:'600',padding:'2px 6px',borderRadius:'10px',background:typeColor[r.type],color:'#475569',textTransform:'capitalize'}}>{r.type}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {showDropdown && query && results.length===0 && !searching && (
            <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,background:'white',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'1px solid #f1f5f9',zIndex:100,padding:'20px',textAlign:'center'}}>
              <p style={{fontSize:'13px',color:'#94a3b8',margin:0}}>No results found</p>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f1f5f9',borderRadius:'10px',padding:'6px 12px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:'700',flexShrink:0}}>{initial}</div>
          <span className="app-username" style={{fontSize:'13px',fontWeight:'600',color:'#475569',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayName}</span>
        </div>
        <NotificationBell />
        <button onClick={handleLogout} style={{padding:'8px 14px',borderRadius:'10px',background:'#fee2e2',color:'#dc2626',fontSize:'13px',fontWeight:'600',border:'none',cursor:'pointer',flexShrink:0}}>Logout</button>
      </div>
    </header>
  );
}