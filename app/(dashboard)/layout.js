import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
export default function DashboardLayout({ children }) {
  return (
    <div style={{display:'flex',height:'100vh',background:'#f1f5f9'}}>
      <Sidebar />
      <div style={{marginLeft:'260px',flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Header />
        <main style={{flex:1,overflowY:'auto',padding:'24px'}}>
          {children}
        </main>
      </div>
    </div>
  );
}