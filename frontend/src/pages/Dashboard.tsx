import { useState, useEffect } from 'react'
import { Activity, ShieldAlert, Users, ServerCrash, Cpu, Network } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { api } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function Dashboard() {
  const wsData = useWebSocket('ws://127.0.0.1:8000/api/v1/ws/dashboard')
  
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: api.getEmployees })
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: api.getAlerts })
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: api.getAgents })
  
  const onlineCount = agents?.filter((a: any) => a.status === 'online').length || 0
  const criticalAlerts = alerts?.filter((a: any) => a.severity === 'Critical' && a.status === 'open').length || 0
  const highRiskUsers = employees?.filter((e: any) => e.risk_score > 60).length || 0
  const avgRisk = employees?.length 
    ? Math.round(employees.reduce((acc: number, curr: any) => acc + curr.risk_score, 0) / employees.length) 
    : 0

  // Dummy graph data for MVP
  const riskTrend = [
    { time: '08:00', risk: 20 },
    { time: '10:00', risk: 22 },
    { time: '12:00', risk: 35 },
    { time: '14:00', risk: 40 },
    { time: '16:00', risk: avgRisk || 85 }, // Use avg risk as latest
  ]

  const cardClass = "bg-surface border border-border p-6 rounded-lg shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-[#D4D2CC] transition-all duration-200 flex items-center gap-4"

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Security Overview</h1>
        <button 
          className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
          data-testid="export-report-btn"
        >
          Export Report
        </button>
      </div>
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={cardClass} data-testid="metric-card-endpoints">
          <div className="p-4 bg-secondary/10 text-secondary rounded-lg"><Users size={24} /></div>
          <div>
            <p className="overline-label">Endpoints Online</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{onlineCount}</p>
          </div>
        </div>
        
        <div className={cardClass} data-testid="metric-card-alerts">
          <div className="p-4 bg-primary/10 text-primary rounded-lg"><ShieldAlert size={24} /></div>
          <div>
            <p className="overline-label">Critical Alerts</p>
            <p className="text-2xl font-bold text-primary mt-1">{criticalAlerts}</p>
          </div>
        </div>

        <div className={cardClass} data-testid="metric-card-users">
          <div className="p-4 bg-[#E06D53]/10 text-[#E06D53] rounded-lg"><Activity size={24} /></div>
          <div>
            <p className="overline-label">High Risk Users</p>
            <p className="text-2xl font-bold text-[#E06D53] mt-1">{highRiskUsers}</p>
          </div>
        </div>

        <div className={cardClass} data-testid="metric-card-risk">
          <div className="p-4 bg-success-background text-success rounded-lg"><ServerCrash size={24} /></div>
          <div>
            <p className="overline-label">Avg Risk Score</p>
            <p className="text-2xl font-bold text-success mt-1">{avgRisk}</p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm" data-testid="chart-container-risk">
          <h3 className="text-xl font-bold mb-4 text-text-primary">Organization Risk Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E2" vertical={false} />
                <XAxis dataKey="time" stroke="#5C5A56" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5C5A56" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAE8E2', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  itemStyle={{ color: '#1A1A1A' }}
                />
                <Line type="monotone" dataKey="risk" stroke="#E06D53" strokeWidth={3} dot={{ r: 4, fill: '#FFFFFF', stroke: '#E06D53', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm" data-testid="live-feed-container">
          <h3 className="text-xl font-bold mb-4 text-text-primary">Live AI Copilot Feed</h3>
          <div className="bg-background rounded-lg p-4 h-64 overflow-y-auto border border-border font-body text-sm shadow-inner">
            {(!alerts || alerts.length === 0) && !wsData && (
              <div className="text-text-disabled mb-2 italic">Waiting for telemetry events...</div>
            )}
            {wsData && (
               <div className="text-primary border-l-2 border-primary pl-3 mb-3 py-1 bg-surface rounded-r shadow-sm">
                 <span className="font-bold text-xs mr-2">[LIVE]</span> {JSON.stringify(wsData)}
               </div>
            )}
            {alerts?.slice(0, 5).map((alert: any) => (
              <div key={alert.id} className={`${alert.severity === 'Critical' ? 'text-primary border-primary' : 'text-[#D15C43] border-[#D15C43]'} border-l-2 pl-3 mb-3 py-2 bg-surface rounded-r shadow-sm flex flex-col gap-1`}>
                <span className="font-bold text-xs tracking-wider uppercase">[{alert.severity}]</span> 
                <span className="text-text-primary">{alert.reason}</span>
                <span className="text-xs text-text-secondary font-medium mt-1">Confidence Score: {alert.confidence}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
