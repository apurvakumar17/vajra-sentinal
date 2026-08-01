import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Shield, Users, AlertTriangle, LogOut, TerminalSquare, MonitorSmartphone, Bot, Bell, Search, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function DashboardLayout() {
  const logout = useAuthStore(state => state.logout)
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: api.getMe })

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`

  return (
    <div className="flex h-screen bg-darker overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-dark border-r border-slate-800 p-5 flex flex-col z-20">
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
          <NavLink to="/endpoints" className={navClass}>
            <MonitorSmartphone size={20} />
            <span className="font-medium">Endpoints</span>
          </NavLink>
          <NavLink to="/copilot" className={navClass}>
            <Bot size={20} />
            <span className="font-medium">AI Copilot</span>
          </NavLink>
        </nav>
        
        <button onClick={logout} className="flex items-center gap-3 text-slate-500 hover:text-accent p-3 mt-auto rounded-xl hover:bg-accent/10 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#020617] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] relative z-10">
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 shrink-0 backdrop-blur-sm bg-[#020617]/50 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search alerts, endpoints, users..."
                className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-64 md:w-96 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-[#020617]"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-800"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                  {user?.full_name || 'Loading...'}
                </span>
                <span className="text-xs text-slate-500">{user?.role || 'SOC Analyst'}</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={18} />}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
