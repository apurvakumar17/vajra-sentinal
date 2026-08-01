import os
import json

files = {
    "sentinel-insider-ai/frontend/src/pages/Dashboard.tsx": """import { useState, useEffect } from 'react'
import { Activity, ShieldAlert, Users, ServerCrash, Cpu, Network } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { apiClient } from '../api/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function Dashboard() {
  const wsData = useWebSocket('ws://127.0.0.1:8000/ws/dashboard')
  const [stats, setStats] = useState({ online: 0, critical: 0, highRisk: 0, avgRisk: 0 })
  
  // Dummy graph data for MVP
  const riskTrend = [
    { time: '08:00', risk: 20 },
    { time: '10:00', risk: 22 },
    { time: '12:00', risk: 35 },
    { time: '14:00', risk: 40 },
    { time: '16:00', risk: 85 }, // Anomaly spike
  ]

  useEffect(() => {
    // In a real app, fetch from backend via React Query
    setStats({
      online: 3,
      critical: 1,
      highRisk: 1,
      avgRisk: 41
    })
  }, [])

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Security Overview</h1>
        <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Export Report
        </button>
      </div>
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark border border-slate-800 p-6 rounded-2xl flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-4 bg-primary/10 text-primary rounded-xl"><Users size={24} /></div>
          <div>
            <p className="text-slate-400 text-sm">Employees Online</p>
            <p className="text-2xl font-bold">{stats.online}</p>
          </div>
        </div>
        
        <div className="bg-dark border border-slate-800 p-6 rounded-2xl flex items-center gap-4 hover:border-accent/50 transition-colors">
          <div className="p-4 bg-accent/10 text-accent rounded-xl"><ShieldAlert size={24} /></div>
          <div>
            <p className="text-slate-400 text-sm">Critical Alerts</p>
            <p className="text-2xl font-bold text-accent">{stats.critical}</p>
          </div>
        </div>

        <div className="bg-dark border border-slate-800 p-6 rounded-2xl flex items-center gap-4 hover:border-orange-500/50 transition-colors">
          <div className="p-4 bg-orange-500/10 text-orange-500 rounded-xl"><Activity size={24} /></div>
          <div>
            <p className="text-slate-400 text-sm">High Risk Users</p>
            <p className="text-2xl font-bold text-orange-500">{stats.highRisk}</p>
          </div>
        </div>

        <div className="bg-dark border border-slate-800 p-6 rounded-2xl flex items-center gap-4 hover:border-green-500/50 transition-colors">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-xl"><ServerCrash size={24} /></div>
          <div>
            <p className="text-slate-400 text-sm">Avg Risk Score</p>
            <p className="text-2xl font-bold text-green-500">{stats.avgRisk}</p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4 text-slate-300">Organization Risk Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4 text-slate-300">Live AI Copilot Feed</h3>
          <div className="bg-slate-900/50 rounded-lg p-4 h-64 overflow-y-auto border border-slate-800 font-mono text-sm">
            <div className="text-slate-500 mb-2">Waiting for WebSocket events...</div>
            {wsData && (
               <div className="text-primary border-l-2 border-primary pl-2 mb-2 animate-in slide-in-from-left-2">
                 [ALERT] {wsData}
               </div>
            )}
            <div className="text-accent border-l-2 border-accent pl-2 mb-2">
              [CRITICAL] Rahul Sharma initiated mass file copy to KINGSTON_64GB. Score: 85.
            </div>
            <div className="text-slate-400 border-l-2 border-slate-700 pl-2 mb-2">
              [INFO] Bob Jones logged in from WIN-HR-02.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
""",
    "sentinel-insider-ai/frontend/src/pages/Alerts.tsx": """import { ShieldAlert, BrainCircuit, ExternalLink } from 'lucide-react'

export default function Alerts() {
  const alertData = {
    id: "ALT-9001",
    user: "Rahul Sharma",
    severity: "Critical",
    score: 85,
    time: "10 mins ago",
    ai_reasoning: {
      Reason: "User deviated significantly from baseline downloads and initiated a mass copy to an unauthorized USB.",
      Evidence: "20 file reads in /SourceCode, 1 USB insertion (KINGSTON_64GB).",
      MITRE: "T1052.001 - Exfiltration Over USB",
      Confidence: "92%"
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8">Incident Response</h1>
      
      <div className="bg-dark border border-accent/50 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-accent" size={28} />
              <h2 className="text-2xl font-bold text-white">Mass Exfiltration Detected</h2>
              <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold border border-accent/30">
                CRITICAL - Score: 85
              </span>
            </div>
            <p className="text-slate-400">Target: {alertData.user} • Time: {alertData.time}</p>
          </div>
          
          <div className="flex gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700">
              Lock Workstation
            </button>
            <button className="bg-accent hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Isolate Endpoint
            </button>
          </div>
        </div>

        {/* Explainable AI Box */}
        <div className="bg-slate-900 border border-primary/30 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <BrainCircuit size={20} />
            <h3 className="font-bold text-lg">Gemini AI Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Reasoning</p>
              <p className="text-slate-200">{alertData.ai_reasoning.Reason}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Evidence</p>
              <p className="text-slate-200 font-mono text-sm">{alertData.ai_reasoning.Evidence}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">MITRE ATT&CK</p>
              <p className="text-blue-400 font-mono text-sm flex items-center gap-2">
                {alertData.ai_reasoning.MITRE} <ExternalLink size={14} />
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Confidence</p>
              <p className="text-green-400 font-bold">{alertData.ai_reasoning.Confidence}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
""",
    "sentinel-insider-ai/frontend/src/App.tsx": """import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'

function App() {
  const token = useAuthStore(state => state.token)

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      
      {/* Protected Routes */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
      </Route>
    </Routes>
  )
}

export default App
""",
    "sentinel-insider-ai/frontend/src/components/DashboardLayout.tsx": """import { Outlet, NavLink } from 'react-router-dom'
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
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Phase 7 Scaffolding completed.")
