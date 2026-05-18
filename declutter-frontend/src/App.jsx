import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import TheVault from './pages/TheVault'
import Declutter from './pages/Declutter'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import AddSubscription from './pages/AddSubscription'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import { useApp } from './context/AppContext'
import { Navigate } from 'react-router-dom'

function App() {
  const { user, loading } = useApp()

  if (loading) return <div style={{ background:'#0F172A', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>Loading...</div>

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />
        
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/vault" element={user ? <TheVault /> : <Navigate to="/login" />} />
        <Route path="/declutter" element={user ? <Declutter /> : <Navigate to="/login" />} />
        <Route path="/insights" element={user ? <Insights /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/add" element={user ? <AddSubscription /> : <Navigate to="/login" />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  )
}

export default App