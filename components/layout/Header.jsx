export default function Header() {
  return (
    <header style={{height:'64px',background:'white',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:40}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f1f5f9',borderRadius:'10px',padding:'8px 12px',width:'220px'}}>
        <span style={{color:'#94a3b8',fontSize:'13px'}}>🔍</span>
        <input placeholder='Search...' style={{background:'transparent',border:'none',outline:'none',fontSize:'13px',color:'#475569',width:'100%'}} />
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative'}}>
          <span>🔔</span>
          <span style={{position:'absolute',top:'6px',right:'6px',width:'8px',height:'8px',background:'#7c3aed',borderRadius:'50%'}}></span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f1f5f9',borderRadius:'10px',padding:'6px 12px',cursor:'pointer'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:'700'}}>A</div>
          <span style={{fontSize:'13px',fontWeight:'600',color:'#475569'}}>Admin</span>
        </div>
      </div>
    </header>
  );
}