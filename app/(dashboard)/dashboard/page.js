'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total:0, pending:0, approved:0, vendors:0 });
  const [allInvoices, setAllInvoices] = useState([]);
  const now = new Date();
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterMonth, setFilterMonth] = useState('all');

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const filteredInv = allInvoices.filter(inv => {
    const d = inv.invoice_date ? new Date(inv.invoice_date) : (inv.created_at ? new Date(inv.created_at) : null);
    if (!d) return false;
    if (filterYear !== 'all' && String(d.getFullYear()) !== filterYear) return false;
    if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
    return true;
  });
  const fStats = {
    total: filteredInv.length,
    pending: filteredInv.filter(i=>i.status==='pending_approval'||i.status==='review').length,
    approved: filteredInv.filter(i=>i.status==='approved').length,
  };
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').order('created_at',{ascending:false});
      const { data: vens } = await supabase.from('vendors').select('id');
      const all = invs || [];
      setStats({ total:all.length, pending:all.filter(i=>i.status==='pending_approval'||i.status==='review').length, approved:all.filter(i=>i.status==='approved').length, vendors:(vens||[]).length });
      setAllInvoices(all);
        setInvoices(all.slice(0,5));
      setLoading(false);
    })();
  }, []);

  const statusStyle = { approved:{bg:'#dcfce7',text:'#16a34a'}, pending_approval:{bg:'#dbeafe',text:'#1d4ed8'}, review:{bg:'#fef9c3',text:'#ca8a04'}, rejected:{bg:'#fee2e2',text:'#dc2626'} };
  const statusLabel = { approved:'Approved', pending_approval:'Pending', review:'Review', rejected:'Rejected' };

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Dashboard</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Welcome back! Here is what is happening today.</p>
        <div style={{display:'flex',gap:'10px',marginTop:'14px',flexWrap:'wrap'}}>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} style={{padding:'8px 14px',borderRadius:'10px',border:'1px solid #e2e8f0',background:'white',fontSize:'13px',fontWeight:'600',color:'#475569',cursor:'pointer'}}>
            <option value='all'>All Years</option>
            <option value='2025'>2025</option>
            <option value='2026'>2026</option>
            <option value='2027'>2027</option>
          </select>
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{padding:'8px 14px',borderRadius:'10px',border:'1px solid #e2e8f0',background:'white',fontSize:'13px',fontWeight:'600',color:'#475569',cursor:'pointer'}}>
            <option value='all'>All Months</option>
            {monthNames.map((m,i)=>(<option key={i} value={i}>{m}</option>))}
          </select>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',marginBottom:'28px'}}>
        {[
          {label:'Total Invoices',value:loading?'...':fStats.total,bg:'linear-gradient(135deg,#7c3aed,#4f46e5)'},
          {label:'Pending / Review',value:loading?'...':fStats.pending,bg:'linear-gradient(135deg,#f59e0b,#f97316)'},
          {label:'Approved',value:loading?'...':fStats.approved,bg:'linear-gradient(135deg,#10b981,#0d9488)'},
          
        ].map(s=>(
          <div key={s.label} style={{background:'white',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <div style={{width:'42px',height:'42px',borderRadius:'12px',background:s.bg,marginBottom:'14px'}}></div>
            <p style={{color:'#64748b',fontSize:'13px',fontWeight:'500',margin:0}}>{s.label}</p>
            <p style={{color:'#0f172a',fontSize:'26px',fontWeight:'700',margin:'4px 0 0'}}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',margin:0}}>Recent Invoices</h3>
          <a href='/finance' style={{fontSize:'13px',color:'#7c3aed',fontWeight:'600',textDecoration:'none'}}>View Finance Queue</a>
        </div>
        {loading && <p style={{color:'#94a3b8',fontSize:'14px'}}>Loading...</p>}
        {!loading && invoices.length===0 && <p style={{color:'#94a3b8',fontSize:'14px'}}>No invoices yet. Upload your first invoice!</p>}
        {!loading && invoices.length>0 && (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid #f1f5f9'}}>
                {['Vendor','Invoice No','Amount','Status','Date'].map(h=>(
                  <th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:'12px',fontWeight:'600',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv=>(
                <tr key={inv.id} style={{borderBottom:'1px solid #f8fafc'}}>
                  <td style={{padding:'14px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'34px',height:'34px',borderRadius:'10px',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'13px',color:'#475569',flexShrink:0}}>{(inv.vendor_name||'?')[0].toUpperCase()}</div>
                      <span style={{fontSize:'14px',fontWeight:'600',color:'#0f172a'}}>{inv.vendor_name||'Unknown'}</span>
                    </div>
                  </td>
                  <td style={{padding:'14px 12px',fontSize:'13px',color:'#64748b'}}>{inv.invoice_number||'-'}</td>
                  <td style={{padding:'14px 12px',fontSize:'14px',fontWeight:'700',color:'#334155'}}>Rs. {Number(inv.total_amount||0).toLocaleString()}</td>
                  <td style={{padding:'14px 12px'}}>
                    <span style={{fontSize:'12px',fontWeight:'600',padding:'4px 10px',borderRadius:'20px',background:statusStyle[inv.status]?.bg||'#f1f5f9',color:statusStyle[inv.status]?.text||'#64748b'}}>{statusLabel[inv.status]||inv.status}</span>
                  </td>
                  <td style={{padding:'14px 12px',fontSize:'13px',color:'#94a3b8'}}>{inv.created_at?new Date(inv.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}