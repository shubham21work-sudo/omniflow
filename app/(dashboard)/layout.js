'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/login'); }
      else { setUser(data.session.user); setChecking(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:'14px'}}>Loading...</div>;
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f1f5f9'}}>
      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} />
      <div className='app-main-wrapper' style={{marginLeft:'260px',flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        <Header user={user} onMenuClick={()=>setSidebarOpen(true)} />
        <main className='app-content' style={{flex:1,overflowY:'auto',padding:'24px'}}>
          {children}
        </main>
      </div>
    </div>
  );
}