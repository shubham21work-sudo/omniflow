'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AnalyticsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const totalSpend = invoices.reduce((sum,i)=>sum+(parseFloat(i.total_amount)||0),0);

  const monthMap = {};
  invoices.forEach(inv => {
    if (inv.invoice_date) {
      const d = new Date(inv.invoice_date);
      const key = d.toLocaleString('en-US',{month:'short',year:'numeric'});
      monthMap[key] = (monthMap[key]||0) + (parseFloat(inv.total_amount)||0);
    }
  });
  const monthlyData = Object.entries(monthMap).map(([month,amount])=>({month,amount}));

  const vendorMap = {};
  invoices.forEach(inv => {
    const name = inv.vendor_name || 'Unknown';
    vendorMap[name] = (vendorMap[name]||0) + (parseFloat(inv.total_amount)||0);
  });
  const vendorData = Object.entries(vendorMap).map(([vendor,amount])=>({vendor,amount})).sort((a,b)=>b.amount-a.amount).slice(0,8);

  const locMap = {};
  invoices.forEach(inv => {
    const loc = inv.location || 'Unknown';
    locMap[loc] = (locMap[loc]||0) + (parseFloat(inv.total_amount)||0);
  });
  const locationData = Object.entries(locMap).map(([location,amount])=>({location,amount}));

  const gstMonthMap = {};
  invoices.forEach(inv => {
    if (inv.invoice_date) {
      const d = new Date(inv.invoice_date);
      const key = d.toLocaleString('en-US',{month:'short',year:'numeric'});
      gstMonthMap[key] = (gstMonthMap[key]||0) + (parseFloat(inv.gst_amount)||0);
    }
  });
  const gstData = Object.entries(gstMonthMap).map(([month,gst])=>({month,gst}));

  const statusData = [
    { name:'Approved', value:approved, color:'#10b981' },
    { name:'Pending Approval', value:pendingApproval, color:'#3b82f6' },
    { name:'Needs Review', value:review, color:'#f59e0b' },
    { name:'Rejected', value:rejected, color:'#ef4444' },
  ].filter(d=>d.value>0);

  const cardStyle = {background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'};

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Analytics</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Insights generated from your invoice data</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'28px'}}>
        {[
          {label:'Total Invoices', value: total, bg:'linear-gradient(135deg,#7c3aed,#4f46e5)'},
          {label:'Total Spend', value: 'Rs. ' + totalSpend.toLocaleString(), bg:'linear-gradient(135deg,#10b981,#0d9488)'},
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
          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Monthly Spend Trend</h3>
            <ResponsiveContainer width='100%' height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='month' tick={{fontSize:12}} />
                <YAxis tick={{fontSize:12}} />
                <Tooltip />
                <Line type='monotone' dataKey='amount' stroke='#7c3aed' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Vendor Wise Spend</h3>
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={vendorData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='vendor' tick={{fontSize:11}} interval={0} angle={-15} textAnchor='end' height={60} />
                <YAxis tick={{fontSize:12}} />
                <Tooltip />
                <Bar dataKey='amount' fill='#4f46e5' radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Location Wise Spend</h3>
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='location' tick={{fontSize:12}} />
                <YAxis tick={{fontSize:12}} />
                <Tooltip />
                <Bar dataKey='amount' fill='#10b981' radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Approval Status</h3>
            <ResponsiveContainer width='100%' height={260}>
              <PieChart>
                <Pie data={statusData} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={90} label>
                  {statusData.map((entry,index)=>(
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{...cardStyle, gridColumn:'1 / -1'}}>
            <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',marginBottom:'16px'}}>Monthly GST Summary</h3>
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={gstData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='month' tick={{fontSize:12}} />
                <YAxis tick={{fontSize:12}} />
                <Tooltip />
                <Bar dataKey='gst' fill='#f59e0b' radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}