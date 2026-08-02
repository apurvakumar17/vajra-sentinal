import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Shield, Users, AlertTriangle, LogOut, TerminalSquare, MonitorSmartphone, Bot, Bell, Search, User, BarChart3, ShieldCheck, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useState } from 'react'

export default function DashboardLayout() {
  const logout = useAuthStore(state => state.logout)
  const { data: user, isError } = useQuery({ queryKey: ['me'], queryFn: api.getMe, retry: 1 })
  const [showDropdown, setShowDropdown] = useState(false)

  // Automatically logout if the token is invalid (API returns 401)
  if (isError) {
    logout()
  }

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 p-3 rounded-xl transition-all font-semibold ${
      isActive 
        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
        : 'text-text-secondary hover:text-text-primary hover:bg-white hover:shadow-sm'
    }`

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-primary">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-border p-5 flex flex-col z-20 shrink-0 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-10 text-primary">
          <Shield size={32} />
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Sentinel AI</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2" data-testid="sidebar-nav">
          <NavLink to="/" className={navClass} data-testid="sidebar-nav-dashboard">
            <TerminalSquare size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/alerts" className={navClass} data-testid="sidebar-nav-alerts">
            <AlertTriangle size={20} />
            <span>Alerts & Incidents</span>
          </NavLink>
          <NavLink to="/employees" className={navClass} data-testid="sidebar-nav-employees">
            <Users size={20} />
            <span>Employees</span>
          </NavLink>
          <NavLink to="/endpoints" className={navClass} data-testid="sidebar-nav-endpoints">
            <MonitorSmartphone size={20} />
            <span>Endpoints</span>
          </NavLink>
          <NavLink to="/reports" className={navClass} data-testid="sidebar-nav-reports">
            <BarChart3 size={20} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/policies" className={navClass} data-testid="sidebar-nav-policies">
            <ShieldCheck size={20} />
            <span>Policies</span>
          </NavLink>
          <NavLink to="/copilot" className={navClass} data-testid="sidebar-nav-copilot">
            <Bot size={20} />
            <span>AI Copilot</span>
          </NavLink>
          <NavLink to="/settings" className={navClass} data-testid="sidebar-nav-settings">
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
        
        <button 
          onClick={logout} 
          className="flex items-center gap-3 font-semibold text-text-secondary hover:text-primary p-3 mt-auto rounded-xl hover:bg-primary/10 transition-colors"
          data-testid="sidebar-logout"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background relative z-10 min-w-0">
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-border flex items-center justify-between px-8 shrink-0 bg-surface sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" size={18} />
              <input 
                type="text" 
                placeholder="Search alerts, endpoints, users..."
                className="bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 md:w-96 transition-all"
                data-testid="global-search-input"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-text-secondary hover:text-primary transition-colors" data-testid="notifications-bell">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface"></span>
            </button>
            
            <div className="h-8 w-px bg-border"></div>
            
            <div className="relative">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setShowDropdown(!showDropdown)}
                data-testid="profile-dropdown-trigger"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {isError ? 'Admin User' : (user?.full_name || 'Loading...')}
                  </span>
                  <span className="text-xs text-text-secondary">{isError ? 'SOC Analyst' : (user?.role || 'SOC Analyst')}</span>
                </div>
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="Profile" className="h-10 w-10 rounded-full object-cover shadow-sm border border-border" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-primary font-bold border border-secondary/30">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                )}
              </div>
              
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-48 bg-surface border border-border rounded-xl shadow-md overflow-hidden py-1 z-50">
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary hover:bg-background hover:text-primary flex items-center gap-2 transition-colors"
                    data-testid="dropdown-logout"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative z-0">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
