import { useState, useEffect } from 'react'
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
