import { useNavigate } from 'react-router-dom'
import { Activity, ShieldAlert, Users, MonitorSmartphone, ServerCrash, Network, ArrowRight } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { api } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const wsData = useWebSocket('/api/v1/ws/dashboard')
  
  const { data: stats } = useQuery({ queryKey: ['dashboard_stats'], queryFn: api.getDashboardStats })
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: api.getEmployees })
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: api.getAlerts })

  const riskTrend = stats?.riskTrend || []
  const loginTrend = stats?.loginTrend || []

  const cardClass = "bg-surface border border-border p-6 rounded-xl shadow-sm hover:shadow-md hover:border-[#D4D2CC] transition-all duration-200 cursor-pointer group"

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Executive Dashboard</h1>
          <p className="text-text-secondary mt-1">Real-time enterprise threat analytics.</p>
        </div>
      </div>
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className={cardClass} onClick={() => navigate('/endpoints')}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary/10 text-secondary rounded-lg"><MonitorSmartphone size={24} /></div>
            <ArrowRight size={18} className="text-text-disabled group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-disabled">Online Endpoints</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{stats?.onlineEndpoints || 0}</p>
        </div>
        
        <div className={cardClass} onClick={() => navigate('/employees')}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary/10 text-secondary rounded-lg"><Users size={24} /></div>
            <ArrowRight size={18} className="text-text-disabled group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-disabled">Active Employees</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{stats?.activeEmployees || 0}</p>
        </div>

        <div className={cardClass} onClick={() => navigate('/alerts')}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg"><ShieldAlert size={24} /></div>
            <ArrowRight size={18} className="text-text-disabled group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-disabled">Critical Alerts</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats?.criticalAlerts || 0}</p>
        </div>

        <div className={cardClass} onClick={() => navigate('/employees')}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#D15C43]/10 text-[#D15C43] rounded-lg"><Activity size={24} /></div>
            <ArrowRight size={18} className="text-text-disabled group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-disabled">High Risk Employees</p>
          <p className="text-3xl font-bold text-[#D15C43] mt-1">{stats?.highRiskEmployees || 0}</p>
        </div>

        <div className={cardClass}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-success-background text-success rounded-lg border border-success/20"><ServerCrash size={24} /></div>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-disabled">Avg Risk Score</p>
          <p className="text-3xl font-bold text-success mt-1">{stats?.avgRisk || 0}</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
            <Activity size={18} className="text-text-secondary" /> Risk Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrend}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D15C43" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D15C43" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E2" vertical={false} />
                <XAxis dataKey="time" stroke="#5C5A56" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5C5A56" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAE8E2', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  itemStyle={{ color: '#1A1A1A' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#D15C43" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
            <Users size={18} className="text-text-secondary" /> Login Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loginTrend}>
                <defs>
                  <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B2B1B" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0B2B1B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E2" vertical={false} />
                <XAxis dataKey="time" stroke="#5C5A56" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5C5A56" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAE8E2', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  itemStyle={{ color: '#1A1A1A' }}
                />
                <Area type="monotone" dataKey="logins" stroke="#0B2B1B" fillOpacity={1} fill="url(#colorLogin)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* High Risk Employees Table */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-sidebar flex justify-between items-center">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <Users size={18} className="text-text-secondary" /> High Risk Employees
            </h3>
            <button onClick={() => navigate('/employees')} className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Employee</th>
                  <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Department</th>
                  <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {employees?.filter((e: any) => e.risk_score >= 60).slice(0, 5).map((emp: any) => (
                  <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="border-b border-border hover:bg-background cursor-pointer transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {emp.photo_url ? (
                          <img src={emp.photo_url} alt={emp.full_name} className="h-8 w-8 rounded-full border border-border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">{emp.full_name.charAt(0)}</div>
                        )}
                        <span className="text-sm font-bold text-text-primary">{emp.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">{emp.department}</td>
                    <td className="p-4 text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold border bg-primary/10 text-primary border-primary/20">
                        {emp.risk_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Telemetry Feed */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border bg-sidebar flex justify-between items-center">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <Network size={18} className="text-text-secondary" /> Live Telemetry
            </h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Connected</span>
            </div>
          </div>
          <div className="flex-1 bg-background p-4 font-mono text-sm overflow-y-auto max-h-[300px]">
             {wsData ? (
               <div className="text-text-primary border-l-2 border-secondary pl-3 mb-3 py-2 bg-surface rounded-r shadow-sm flex flex-col">
                 <span className="text-xs text-text-secondary mb-1">{new Date().toLocaleTimeString()}</span>
                 <span>{JSON.stringify(wsData)}</span>
               </div>
             ) : (
               <div className="text-text-disabled italic text-center py-8">Waiting for incoming telemetry events...</div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
