'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const ref = useRef(null);

  const load = async (em) => {
    const e = em || email;
    if (!e) return;
    const { data } = await supabase.from('notifications').select('*').eq('recipient_email', e).order('created_at', { ascending: false }).limit(20);
    setItems(data || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const e = data?.session?.user?.email || '';
      setEmail(e);
      load(e);
    });
  }, []);

  useEffect(() => {
    if (!email) return;
    const t = setInterval(() => load(email), 30000);
    return () => clearInterval(t);
  }, [email]);

  useEffect(() => {
    const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const unread = items.filter(i => !i.is_read).length;

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (next) await load(email);
  };

  const clickItem = async (n) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setItems(p => p.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    const ids = items.filter(i => !i.is_read).map(i => i.id);
    if (ids.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    setItems(p => p.map(x => ({ ...x, is_read: true })));
  };

  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={openPanel} style={{width:'40px',height:'40px',borderRadius:'10px',background:'#f1f5f9',border:'none',cursor:'pointer',fontSize:'18px',position:'relative'}} aria-label='Notifications'>
        🔔
        {unread > 0 && <span style={{position:'absolute',top:'4px',right:'4px',minWidth:'16px',height:'16px',padding:'0 4px',borderRadius:'8px',background:'#ef4444',color:'white',fontSize:'10px',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}
      </button>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:'340px',maxWidth:'calc(100vw - 32px)',background:'white',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.15)',border:'1px solid #f1f5f9',zIndex:200,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'14px',fontWeight:'700',color:'#0f172a'}}>Notifications</span>
            {unread > 0 && <button onClick={markAll} style={{background:'none',border:'none',color:'#7c3aed',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>Mark all read</button>}
          </div>
          <div style={{maxHeight:'400px',overflowY:'auto'}}>
            {items.length === 0 && <div style={{padding:'24px',textAlign:'center',color:'#94a3b8',fontSize:'13px'}}>No notifications yet</div>}
            {items.map(n => (
              <div key={n.id} onClick={()=>clickItem(n)} style={{padding:'12px 16px',borderBottom:'1px solid #f8fafc',cursor:'pointer',background: n.is_read ? 'white' : '#faf5ff'}}>
                <div style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  {!n.is_read && <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#7c3aed',marginTop:'5px',flexShrink:0}}></span>}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'13px',fontWeight:'600',color:'#0f172a',margin:0}}>{n.title}</p>
                    <p style={{fontSize:'12px',color:'#64748b',margin:'2px 0 0',lineHeight:'1.4'}}>{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}