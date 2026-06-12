export default function SignupPage() {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'420px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'16px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'22px',fontWeight:'800',color:'white'}}>O</div>
          <h1 style={{color:'white',fontSize:'26px',fontWeight:'700',margin:'0 0 8px'}}>Create account</h1>
          <p style={{color:'#94a3b8',fontSize:'14px',margin:0}}>Start using OmniFlow today</p>
        </div>
        <div style={{background:'white',borderRadius:'20px',padding:'32px',boxShadow:'0 25px 50px rgba(0,0,0,0.4)'}}>
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Full Name</label>
            <input type='text' placeholder='Your full name' style={{width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Email Address</label>
            <input type='email' placeholder='you@company.com' style={{width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
          </div>
          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Password</label>
            <input type='password' placeholder='Create a password' style={{width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
          </div>
          <button style={{width:'100%',padding:'13px',borderRadius:'10px',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'white',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer',marginBottom:'16px'}}>Create Account</button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#6b7280',margin:0}}>Already have an account? <a href='/login' style={{color:'#7c3aed',fontWeight:'600',textDecoration:'none'}}>Sign in</a></p>
        </div>
      </div>
    </div>
  );
}