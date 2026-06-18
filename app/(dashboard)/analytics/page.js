'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const DONUT_COLORS = ['#7c3aed','#4f46e5','#10b981','#0ea5e9','#f59e0b','#ef4444','#ec4899','#14b8a6'];

function money(v){ return 'Rs. ' + Math.round(v||0).toLocaleString('en-IN'); }

function MoneyTooltip({ active, payload, label }){
  if (active && payload && payload.length){
    return (<div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'10px 14px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}><p style={{fontSize:'12px',color:'#64748b',margin:'0 0 4px',fontWeight:'600'}}>{label || payload[0].name}</p><p style={{fontSize:'14px',color:'#0f172a',margin:0,fontWeight:'700'}}>{money(payload[0].value)}</p></div>);
  }
  return null;
}

export default function AnalyticsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [ai, setAi] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('invoices').select('*');
      setInvoices(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div style={{textAlign:'center',padding:'80px',color:'#94a3b8',fontSize:'14px'}}>Loading analytics...</div>;
  }

  const total = invoices.length;
  const approved = invoices.filter(i=>i.status==='approved').length;
  const rejected = invoices.filter(i=>i.status==='rejected').length;
  const review = invoices.filter(i=>i.status==='review').length;
  const pendingApproval = invoices.filter(i=>i.status==='pending_approval').length;
  const totalSpend = invoices.reduce((s,i)=>s+(parseFloat(i.total_amount)||0),0);
  const totalGst = invoices.reduce((s,i)=>s+(parseFloat(i.gst_amount)||0),0);

  const monthMap = {};
  invoices.forEach(inv => { if (inv.invoice_date) { const d=new Date(inv.invoice_date); const k=d.toLocaleString('en-US',{month:'short',year:'numeric'}); monthMap[k]=(monthMap[k]||0)+(parseFloat(inv.total_amount)||0); } });
  const monthlyData = Object.entries(monthMap).map(([month,amount])=>({month,amount}));

  const vendorMap = {};
  invoices.forEach(inv => { const n=inv.vendor_name||'Unknown'; vendorMap[n]=(vendorMap[n]||0)+(parseFloat(inv.total_amount)||0); });
  const vendorData = Object.entries(vendorMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8);

  const locMap = {};
  invoices.forEach(inv => { const l=inv.location||'Unknown'; locMap[l]=(locMap[l]||0)+(parseFloat(inv.total_amount)||0); });
  const locationData = Object.entries(locMap).map(([name,value])=>({name,value}));

  const gstMonthMap = {};
  invoices.forEach(inv => { if (inv.invoice_date) { const d=new Date(inv.invoice_date); const k=d.toLocaleString('en-US',{month:'short',year:'numeric'}); gstMonthMap[k]=(gstMonthMap[k]||0)+(parseFloat(inv.gst_amount)||0); } });
  const gstData = Object.entries(gstMonthMap).map(([month,gst])=>({month,gst}));

  const statusData = [
    { name:'Approved', value:approved, color:'#10b981' },
    { name:'Pending Approval', value:pendingApproval, color:'#3b82f6' },
    { name:'Needs Review', value:review, color:'#f59e0b' },
    { name:'Rejected', value:rejected, color:'#ef4444' },
  ].filter(d=>d.value>0);

  const monthCount = monthlyData.length;
  const projection = monthCount > 0 ? Math.round(totalSpend / monthCount) : 0;

  const generateInsights = async () => {
    setAiLoading(true); setAiError(''); setAi(null);
    try {
      const stats = {
        totalInvoices: total, totalSpend: Math.round(totalSpend),
        approved, pending: pendingApproval + review, rejected, totalGst: Math.round(totalGst),
        monthly: monthlyData.map(m=>({ month:m.month, amount:Math.round(m.amount) })),
        topVendors: vendorData.slice(0,5).map(v=>({ vendor:v.name, amount:Math.round(v.value) })),
        byLocation: locationData.map(l=>({ location:l.name, amount:Math.round(l.value) })),
        monthCount, projection,
      };
      const res = await fetch('/api/insights', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stats }) });
      const data = await res.json();
      setAi(data);
    } catch (err) { setAiError('Could not generate insights. Please try again.'); }
    setAiLoading(false);
  };

  const pieLabel = ({ name, percent }) => (percent*100).toFixed(0) + '%';
  const cardStyle = {background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'};

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Analytics</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Insights generated from your invoice data</p>
      </div>

      <div style={{background:'linear-gradient(135deg,#faf5ff,#f5f3ff)',border:'1px solid #e9d5ff',borderRadius:'16px',padding:'24px',marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px',flexWrap:'wrap'}}>
          <div>
            <h3 style={{fontSize:'16px',fontWeight:'700',color:'#6d28d9',margin:0}}>AI Financial Insights</h3>
            <p style={{fontSize:'13px',color:'#7c3aed',margin:'4px 0 0',opacity:0.8}}>Let AI analyze your spending and project next month</p>
          </div>
          <button onClick={generateInsights} disabled={aiLoading || total===0} style={{padding:'11px 22px',borderRadius:'10px',background: total===0 ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'13px',fontWeight:'600',border:'none',cursor: total===0 ? 'not-allowed':'pointer',whiteSpace:'nowrap'}}>{aiLoading ? 'Analyzing...' : 'Generate AI Insights'}</button>
        </div>
        {total===0 && <p style={{fontSize:'13px',color:'#94a3b8',margin:'16px 0 0'}}>Add some invoices first to generate insights.</p>}
        {aiError && <p style={{fontSize:'13px',color:'#dc2626',fontWeight:'600',margin:'16px 0 0'}}>{aiError}</p>}
        {ai && (
          <div style={{marginTop:'20px'}}>
            {ai.summary && <p style={{fontSize:'14px',color:'#374151',lineHeight:'1.6',margin:'0 0 16px'}}>{ai.summary}</p>}
            {ai.insights && ai.insights.length>0 && (
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
                {ai.insights.map((point,idx)=>(
                  <div key={idx} style={{display:'flex',gap:'10px',alignItems:'flex-start',background:'white',borderRadius:'10px',padding:'12px 14px',border:'1px solid #f1f5f9'}}>
                    <span style={{color:'#7c3aed',fontWeight:'700',fontSize:'14px',flexShrink:0}}>{idx+1}</span>
                    <span style={{fontSize:'13px',color:'#334155',lineHeight:'1.5'}}>{point}</span>
                  </div>
                ))}
              </div>
            )}
            {ai.projection_note && (
              <div style={{background:'white',borderRadius:'10px',padding:'14px 16px',border:'1px solid #ddd6fe'}}>
                <p style={{fontSize:'12px',fontWeight:'700',color:'#6d28d9',textTransform:'uppercase',letterSpacing:'0.04em',margin:'0 0 6px'}}>Next Month Projection: {money(projection)}</p>
                <p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.5',margin:0}}>{ai.projection_note}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'28px'}}>
        {[
          {label:'Total Invoices', value: total, bg:'linear-gradient(135deg,#7c3aed,#4f46e5)'},
          {label:'Total Spend', value: money(totalSpend), bg:'linear-gradient(135deg,#10b981,#0d9488)'},
          {label:'Approved', value: approved, bg:'linear-gradient(135deg,#38bdf8,#3b82f6)'},
          {label:'Pending / Review', value: pendingApproval+review, bg:'linear-gradient(135deg,#f59e0b,#f97316)'},
        ].map(s=>(
          <div key={s.label} style={cardStyle}>
            <div style={{width:'42px',height:'42px',borderRadius:'12px',background:s.bg,marginBottom:'14px'}}></div>
            <p style={{color:'#64748b',fontSize:'13px',fontWeight:'500',margin:0}}>{s.label}</p>
            <p style={{color:'#0f172a',fontSize:'24px',fontWeight:'700',margin:'4px 0 0'}}>{s.value}</p>
          </div>
        ))}
      </div>

      {total===0 && (
        <div style={{...cardStyle,padding:'60px',textAlign:'center'}}>
          <p style={{color:'#94a3b8',fontSize:'14px'}}>No invoices yet. Upload and approve invoices to see analytics here.</p>
        </div>
      )}

      {total>0 && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
          <div style={{...cardStyle, gridColumn:'1 / -1'}}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Monthly Spend Trend</h3>
            <ResponsiveContainer width='100%' height={280}>
              <AreaChart data={monthlyData}>
                <defs><linearGradient id='spendGrad' x1='0' y1='0' x2='0' y2='1'><stop offset='5%' stopColor='#7c3aed' stopOpacity={0.4}/><stop offset='95%' stopColor='#7c3aed' stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='month' tick={{fontSize:12}} />
                <YAxis tick={{fontSize:12}} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type='monotone' dataKey='amount' stroke='#7c3aed' strokeWidth={2.5} fill='url(#spendGrad)' />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Vendor Wise Spend</h3>
            <ResponsiveContainer width='100%' height={280}>
              <PieChart>
                <Pie data={vendorData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={55} outerRadius={95} paddingAngle={2} label={pieLabel}>
                  {vendorData.map((e,i)=>(<Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />))}
                </Pie>
                <Tooltip content={<MoneyTooltip />} />
                <Legend wrapperStyle={{fontSize:'11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Location Wise Spend</h3>
            <ResponsiveContainer width='100%' height={280}>
              <PieChart>
                <Pie data={locationData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={55} outerRadius={95} paddingAngle={2} label={pieLabel}>
                  {locationData.map((e,i)=>(<Cell key={i} fill={DONUT_COLORS[(i+2) % DONUT_COLORS.length]} />))}
                </Pie>
                <Tooltip content={<MoneyTooltip />} />
                <Legend wrapperStyle={{fontSize:'11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Approval Status</h3>
            <ResponsiveContainer width='100%' height={280}>
              <PieChart>
                <Pie data={statusData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={55} outerRadius={95} paddingAngle={2} label={pieLabel}>
                  {statusData.map((e,i)=>(<Cell key={i} fill={e.color} />))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{fontSize:'11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Monthly GST Summary</h3>
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={gstData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='month' tick={{fontSize:12}} />
                <YAxis tick={{fontSize:12}} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey='gst' fill='#f59e0b' radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}