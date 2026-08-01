import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Shield, Users, AlertTriangle, LogOut, TerminalSquare } from 'lucide-react'

export default function DashboardLayout() {
  const logout = useAuthStore(state => state.logout)

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`

  return (
    <div className="flex h-screen bg-darker">
      {/* Sidebar */}
      <div className="w-64 bg-dark border-r border-slate-800 p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-10 text-primary">
          <Shield size={32} />
          <h1 className="text-xl font-bold text-white tracking-tight">Sentinel AI</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <NavLink to="/" className={navClass}>
            <TerminalSquare size={20} />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <NavLink to="/alerts" className={navClass}>
            <AlertTriangle size={20} />
            <span className="font-medium">Alerts & Incidents</span>
          </NavLink>
          <NavLink to="/employees" className={navClass}>
            <Users size={20} />
            <span className="font-medium">Employees</span>
          </NavLink>
        </nav>
        
        <button onClick={logout} className="flex items-center gap-3 text-slate-500 hover:text-accent p-3 mt-auto rounded-xl hover:bg-accent/10 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 bg-[#020617] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
        <Outlet />
      </div>
    </div>
  )
}
