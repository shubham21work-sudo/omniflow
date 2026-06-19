'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ADMIN_EMAIL } from '../../lib/config';

const baseNav = [
  {label:'Dashboard', href:'/dashboard'},
  {label:'Agreements', href:'/agreements', children:[
    {label:'Upload Agreement', href:'/agreements'},
    {label:'Active Agreements', href:'/agreements/active'},
  ]},
  {label:'Vendors', href:'/vendors', children:[
    {label:'Upload Vendor', href:'/vendors'},
    {label:'Active Vendors', href:'/vendors/active'},
  ]},
  {label:'Invoices', href:'/invoices', children:[
    {label:'Upload Invoice', href:'/invoices'},
    {label:'Active Invoices', href:'/invoices/all'},
  ]},
  {label:'Approvals', href:'/approvals'},
  {label:'Finance Queue', href:'/finance'},
  {label:'Analytics', href:'/analytics', children:[
    {label:'Financial', href:'/analytics'},
    {label:'TAT Analytics', href:'/analytics/tat'},
  ]},
  {label:'My Account', href:'/account'},
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const path = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [openMenu, setOpenMenu] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data?.session?.user?.email || '';
      setIsAdmin(email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    });
  }, []);

  useEffect(() => {
    if (path && path.startsWith('/agreements')) setOpenMenu('Agreements');
    else if (path && path.startsWith('/vendors')) setOpenMenu('Vendors');
    else if (path && path.startsWith('/invoices')) setOpenMenu('Invoices');
    else if (path && path.startsWith('/analytics')) setOpenMenu('Analytics');
  }, [path]);

  const nav = isAdmin ? [...baseNav, {label:'Settings', href:'/settings'}] : baseNav;

  const linkStyle = (active) => ({display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'10px',marginBottom:'4px',textDecoration:'none',background:active?'#7c3aed':'transparent',color:active?'white':'#94a3b8',fontSize:'14px',fontWeight:'500',transition:'all 0.15s',cursor:'pointer'});

  return (
    <>
      {open && (
        <div className='app-sidebar-overlay' onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:49}}></div>
      )}
      <aside className={'app-sidebar' + (open ? ' open' : '')} style={{width:'260px',position:'fixed',top:0,left:0,height:'100vh',background:'#0f172a',display:'flex',flexDirection:'column',zIndex:50}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #1e293b',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'16px'}}>O</div>
          <div><p style={{color:'white',fontWeight:'700',fontSize:'16px',margin:0}}>OmniFlow</p><p style={{color:'#64748b',fontSize:'11px',margin:0}}>Invoice Platform</p></div>
        </div>
        <nav style={{flex:1,padding:'16px 12px',overflowY:'auto'}}>
          {nav.map(item=>(
            item.children ? (
              <div key={item.label} onMouseEnter={()=>setOpenMenu(item.label)}>
                <div onClick={()=>setOpenMenu(openMenu===item.label?'':item.label)} style={linkStyle(path && path.startsWith(item.href))}>
                  <span>{item.label}</span>
                  <span style={{fontSize:'10px'}}>{openMenu===item.label?'▾':'▸'}</span>
                </div>
                {openMenu===item.label && (
                  <div style={{marginLeft:'10px',borderLeft:'1px solid #1e293b',paddingLeft:'8px',marginBottom:'4px'}}>
                    {item.children.map(sub=>(
                      <Link key={sub.href} href={sub.href} onClick={onClose} style={{display:'block',padding:'8px 12px',borderRadius:'8px',marginBottom:'2px',textDecoration:'none',background:path===sub.href?'#7c3aed':'transparent',color:path===sub.href?'white':'#94a3b8',fontSize:'13px',fontWeight:'500'}}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.href} href={item.href} onClick={onClose} style={linkStyle(path===item.href)}>
                <span>{item.label}</span>
              </Link>
            )
          ))}
        </nav>
        <div style={{padding:'16px',borderTop:'1px solid #1e293b'}}>
          <p style={{color:'#475569',fontSize:'12px',textAlign:'center',margin:0}}>OmniFlow v1.0</p>
        </div>
      </aside>
    </>
  );
}