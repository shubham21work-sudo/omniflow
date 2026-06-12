export default function DashboardPage() {
  const stats = [{label:'Total Invoices',value:'1,284',change:'+12%',bg:'linear-gradient(135deg,#7c3aed,#4f46e5)'},{label:'Pending Approval',value:'48',change:'+3%',bg:'linear-gradient(135deg,#f59e0b,#f97316)'},{label:'Approved',value:'227',change:'+8%',bg:'linear-gradient(135deg,#10b981,#0d9488)'},{label:'Active Vendors',value:'67',change:'+2%',bg:'linear-gradient(135deg,#38bdf8,#3b82f6)'}];
  const invoices = [{vendor:'Tata Consultancy',invoice:'INV-2024-001',amount:'1,20,000',status:'Approved',sc:'#dcfce7',tc:'#16a34a'},{vendor:'Infosys Ltd',invoice:'INV-2024-002',amount:'85,000',status:'Pending',sc:'#fef9c3',tc:'#ca8a04'},{vendor:'Wipro Services',invoice:'INV-2024-003',amount:'2,40,000',status:'Review',sc:'#fee2e2',tc:'#dc2626'},{vendor:'HCL Technologies',invoice:'INV-2024-004',amount:'55,000',status:'Approved',sc:'#dcfce7',tc:'#16a34a'},{vendor:'Tech Mahindra',invoice:'INV-2024-005',amount:'98,000',status:'Pending',sc:'#fef9c3',tc:'#ca8a04'}];
  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h2 style={{fontSize:'22px',fontWeight:'700',color:'#0f172a',margin:0}}>Dashboard</h2>
        <p style={{color:'#64748b',fontSize:'14px',margin:'4px 0 0'}}>Welcome back! Here is what is happening today.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'28px'}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:'white',borderRadius:'16px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <div style={{width:'42px',height:'42px',borderRadius:'12px',background:s.bg,marginBottom:'14px'}}></div>
            <p style={{color:'#64748b',fontSize:'13px',fontWeight:'500',margin:0}}>{s.label}</p>
            <p style={{color:'#0f172a',fontSize:'26px',fontWeight:'700',margin:'4px 0'}}>{s.value}</p>
            <p style={{color:'#10b981',fontSize:'12px',fontWeight:'600',margin:0}}>{s.change} this month</p>
          </div>
        ))}
      </div>
      <div style={{background:'white',borderRadius:'16px',padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0f172a',margin:0}}>Recent Invoices</h3>
          <span style={{fontSize:'13px',color:'#7c3aed',fontWeight:'600',cursor:'pointer'}}>View All</span>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid #f1f5f9'}}>
              {['Vendor','Invoice No','Amount','Status','Date'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:'12px',fontWeight:'600',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(item=>(
              <tr key={item.invoice} style={{borderBottom:'1px solid #f8fafc'}}>
                <td style={{padding:'14px 12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'34px',height:'34px',borderRadius:'10px',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'13px',color:'#475569',flexShrink:0}}>{item.vendor[0]}</div>
                    <span style={{fontSize:'14px',fontWeight:'600',color:'#0f172a'}}>{item.vendor}</span>
                  </div>
                </td>
                <td style={{padding:'14px 12px',fontSize:'13px',color:'#64748b'}}>{item.invoice}</td>
                <td style={{padding:'14px 12px',fontSize:'14px',fontWeight:'700',color:'#334155'}}>Rs. {item.amount}</td>
                <td style={{padding:'14px 12px'}}><span style={{fontSize:'12px',fontWeight:'600',padding:'4px 10px',borderRadius:'20px',background:item.sc,color:item.tc}}>{item.status}</span></td>
                <td style={{padding:'14px 12px',fontSize:'13px',color:'#94a3b8'}}>Jun 2024</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}