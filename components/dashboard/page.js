export default function DashboardPage() {
  return (
    <div>
      <h2 style={{fontSize:'24px', fontWeight:'700', color:'#0f172a', marginBottom:'24px'}}>
        Welcome to OmniFlow
      </h2>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'32px'}}>
        {[
          { label:'Total Invoices', value:'1,284', change:'+12%', bg:'linear-gradient(135deg,#7c3aed,#4f46e5)' },
          { label:'Pending Approval', value:'48', change:'+3%', bg:'linear-gradient(135deg,#f59e0b,#f97316)' },
          { label:'Approved', value:'227', change:'+8%', bg:'linear-gradient(135deg,#10b981,#0d9488)' },
          { label:'Active Vendors', value:'67', change:'+2%', bg:'linear-gradient(135deg,#38bdf8,#3b82f6)' },
        ].map((stat) => (
          <div key={stat.label} style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', border:'1px solid #f1f5f9'}}>
            <div style={{width:'40px', height:'40px', borderRadius:'12px', background:stat.bg, marginBottom:'16px'}}></div>
            <p style={{color:'#64748b', fontSize:'13px', fontWeight:'500'}}>{stat.label}</p>
            <p style={{color:'#0f172a', fontSize:'28px', fontWeight:'700', margin:'4px 0'}}>{stat.value}</p>
            <p style={{color:'#10b981', fontSize:'12px', fontWeight:'600'}}>{stat.change} this month</p>
          </div>
        ))}
      </div>

      <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', border:'1px solid #f1f5f9'}}>
        <h3 style={{fontSize:'15px', fontWeight:'600', color:'#0f172a', marginBottom:'20px'}}>Recent Invoices</h3>
        {[
          { vendor:'Tata Consultancy', invoice:'INV-2024-001', amount:'₹1,20,000', status:'Approved', color:'#dcfce7', textColor:'#16a34a' },
          { vendor:'Infosys Ltd', invoice:'INV-2024-002', amount:'₹85,000', status:'Pending', color:'#fef9c3', textColor:'#ca8a04' },
          { vendor:'Wipro Services', invoice:'INV-2024-003', amount:'₹2,40,000', status:'Review', color:'#fee2e2', textColor:'#dc2626' },
          { vendor:'HCL Technologies', invoice:'INV-2024-004', amount:'₹55,000', status:'Approved', color:'#dcfce7', textColor:'#16a34a' },
        ].map((item) => (
          <div key={item.invoice} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #f8fafc'}}>
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'36px', height:'36px', borderRadius:'12px', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', color:'#475569'}}>
                {item.vendor[0]}
              </div>
              <div>
                <p style={{fontSize:'14px', fontWeight:'600', color:'#0f172a'}}>{item.vendor}</p>
                <p style={{fontSize:'12px', color:'#94a3b8'}}>{item.invoice}</p>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
              <p style={{fontSize:'14px', fontWeight:'700', color:'#334155'}}>{item.amount}</p>
              <span style={{fontSize:'12px', fontWeight:'600', padding:'4px 10px', borderRadius:'20px', background:item.color, color:item.textColor}}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}