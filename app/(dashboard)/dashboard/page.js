'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
  const [allInvoices, setAllInvoices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [filterMonth, setFilterMonth] = useState('all');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').order('created_at',{ascending:false});
      const all = invs || [];
      setAllInvoices(all);
      setInvoices(all.slice(0,5));
      setLoading(false);
    })();
  }, []);

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
    spend: filteredInv.reduce((a,i)=>a+Number(i.total_amount||0),0),
  };

  // category breakdown for chart
  const catMap = {};
  filteredInv.forEach(i=>{ const c=i.category||'Uncategorized'; catMap[c]=(catMap[c]||0)+Number(i.total_amount||0); });
  const chartData = Object.entries(catMap).map(([name,value])=>({name,value})).filter(d=>d.value>0).sort((a,b)=>b.value-a.value);
  const DONUT = ['#4F46E5','#0D9488','#F59E0B','#EC4899','#8B5CF6','#06B6D4','#10B981','#F97316','#64748B'];

  const statusStyle = { approved:{bg:'#DCFCE7',text:'#16A34A'}, pending_approval:{bg:'#DBEAFE',text:'#1D4ED8'}, review:{bg:'#FEF9C3',text:'#CA8A04'}, rejected:{bg:'#FEE2E2',text:'#DC2626'} };
  const statusLabel = { approved:'Approved', pending_approval:'Pending', review:'Review', rejected:'Rejected' };

  const cards = [
    {label:'Total Invoices', value:loading?'...':fStats.total, grad:'linear-gradient(135deg,#6366F1,#4338CA)', icon:'M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z'},
    {label:'Pending / Review', value:loading?'...':fStats.pending, grad:'linear-gradient(135deg,#F59E0B,#EA580C)', icon:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'},
    {label:'Approved', value:loading?'...':fStats.approved, grad:'linear-gradient(135deg,#10B981,#0D9488)', icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'},
    {label:'Total Spend', value:loading?'...':'Rs. '+fStats.spend.toLocaleString('en-IN'), grad:'linear-gradient(135deg,#EC4899,#BE185D)', icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1', small:true},
  ];

  return (
    <div style={{fontFamily:'Inter, system-ui, sans-serif'}}>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'27px',fontWeight:'800',color:'#0F172A',margin:0,letterSpacing:'-0.02em'}}>Dashboard</h2>
        <p style={{color:'#64748B',fontSize:'14px',margin:'5px 0 0'}}>Welcome back! Here is what is happening today.</p>
        <div style={{display:'flex',gap:'10px',marginTop:'16px',flexWrap:'wrap'}}>
          <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} style={{padding:'9px 16px',borderRadius:'10px',border:'1px solid #E2E8F0',background:'white',fontSize:'13px',fontWeight:'600',color:'#475569',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
            <option value='all'>All Years</option>
            <option value='2025'>2025</option>
            <option value='2026'>2026</option>
            <option value='2027'>2027</option>
          </select>
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{padding:'9px 16px',borderRadius:'10px',border:'1px solid #E2E8F0',background:'white',fontSize:'13px',fontWeight:'600',color:'#475569',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
            <option value='all'>All Months</option>
            {monthNames.map((m,i)=>(<option key={i} value={i}>{m}</option>))}
          </select>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'18px',marginBottom:'22px'}}>
        {cards.map(s=>(
          <div key={s.label} style={{background:s.grad,borderRadius:'18px',padding:'20px',boxShadow:'0 8px 20px rgba(79,70,229,0.18)',position:'relative',overflow:'hidden'}}>
            <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'rgba(255,255,255,0.20)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
              <svg width='21' height='21' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d={s.icon}/></svg>
            </div>
            <p style={{color:'rgba(255,255,255,0.85)',fontSize:'13px',fontWeight:'600',margin:0}}>{s.label}</p>
            <p style={{color:'white',fontSize:s.small?'21px':'30px',fontWeight:'800',margin:'5px 0 0',letterSpacing:'-0.01em'}}>{s.value}</p>
            <div style={{position:'absolute',top:'-30px',right:'-30px',width:'110px',height:'110px',borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}></div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'22px'}}>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr)',gap:'22px',alignItems:'stretch'}} className='dash-grid'>

          <div style={{background:'white',borderRadius:'18px',padding:'24px',boxShadow:'0 4px 14px rgba(15,23,42,0.05)',border:'1px solid #F1F5F9'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',flexWrap:'wrap',gap:'8px'}}>
              <h3 style={{fontSize:'17px',fontWeight:'700',color:'#0F172A',margin:0}}>Recent Invoices</h3>
              <a href='/finance' style={{fontSize:'13px',color:'#4F46E5',fontWeight:'700',textDecoration:'none'}}>View Finance Queue →</a>
            </div>
            {loading && <p style={{color:'#94A3B8',fontSize:'14px'}}>Loading...</p>}
            {!loading && invoices.length===0 && <p style={{color:'#94A3B8',fontSize:'14px'}}>No invoices yet. Upload your first invoice!</p>}
            {!loading && invoices.length>0 && (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:'460px'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid #F1F5F9'}}>
                      {['Vendor','Invoice No','Amount','Status'].map(h=>(
                        <th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:'11px',fontWeight:'700',color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv=>(
                      <tr key={inv.id} style={{borderBottom:'1px solid #F8FAFC'}}>
                        <td style={{padding:'13px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <div style={{width:'32px',height:'32px',borderRadius:'9px',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'13px',color:'#4F46E5',flexShrink:0}}>{(inv.vendor_name||'?')[0].toUpperCase()}</div>
                            <span style={{fontSize:'13px',fontWeight:'600',color:'#0F172A'}}>{inv.vendor_name||'Unknown'}</span>
                          </div>
                        </td>
                        <td style={{padding:'13px 12px',fontSize:'13px',color:'#64748B'}}>{inv.invoice_number||'-'}</td>
                        <td style={{padding:'13px 12px',fontSize:'13px',fontWeight:'700',color:'#334155'}}>Rs. {Number(inv.total_amount||0).toLocaleString('en-IN')}</td>
                        <td style={{padding:'13px 12px'}}>
                          <span style={{fontSize:'12px',fontWeight:'600',padding:'4px 11px',borderRadius:'20px',background:statusStyle[inv.status]?.bg||'#F1F5F9',color:statusStyle[inv.status]?.text||'#64748B'}}>{statusLabel[inv.status]||inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{background:'white',borderRadius:'18px',padding:'24px',boxShadow:'0 4px 14px rgba(15,23,42,0.05)',border:'1px solid #F1F5F9'}}>
            <h3 style={{fontSize:'17px',fontWeight:'700',color:'#0F172A',margin:'0 0 8px'}}>Spend by Category</h3>
            {chartData.length===0 ? (
              <p style={{color:'#94A3B8',fontSize:'13px',marginTop:'30px',textAlign:'center'}}>No spend data for this period yet.</p>
            ) : (
              <>
                <div style={{width:'100%',display:'flex',justifyContent:'center'}}>
                  <PieChart width={220} height={200}>
                    <Pie data={chartData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {chartData.map((e,i)=><Cell key={i} fill={DONUT[i%DONUT.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v)=>'Rs. '+Number(v).toLocaleString('en-IN')} />
                  </PieChart>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'7px',marginTop:'10px'}}>
                  {chartData.slice(0,5).map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'12px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{width:'10px',height:'10px',borderRadius:'3px',background:DONUT[i%DONUT.length]}}></span>
                        <span style={{color:'#475569',fontWeight:'600'}}>{e.name}</span>
                      </div>
                      <span style={{color:'#0F172A',fontWeight:'700'}}>Rs. {e.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      <style>{`@media (max-width: 900px){ .dash-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}