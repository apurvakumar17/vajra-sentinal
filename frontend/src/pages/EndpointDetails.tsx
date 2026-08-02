import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { MonitorSmartphone, Shield, Power, LogOut, TerminalSquare, Activity, HardDrive, Wifi, ShieldCheck, CheckCircle2, ArrowLeft, Clock } from 'lucide-react'

export default function EndpointDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: agents, isLoading } = useQuery({ queryKey: ['endpoints'], queryFn: api.getEndpoints })
  
  const agent = agents?.find((a: any) => a.id === id)

  if (isLoading) return <div className="p-8 text-text-disabled text-center animate-pulse">Loading Endpoint...</div>
  if (!agent) return <div className="p-8 text-text-secondary text-center">Endpoint not found.</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl border shadow-sm ${agent.status === 'online' ? 'bg-success-background text-success border-success/20' : 'bg-background text-text-secondary border-border'}`}>
            <MonitorSmartphone size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              {agent.hostname}
            </h1>
            <div className="flex items-center gap-3 text-sm text-text-secondary font-medium mt-1">
              <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'animate-pulse bg-success' : 'bg-text-disabled'}`}></span>
              <span className="capitalize">{agent.status}</span>
              <span className="text-border">|</span>
              <span className="font-mono text-xs">ID: {agent.id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2 border-b border-border pb-4">
              <HardDrive size={20} className="text-text-secondary" /> Device Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Assigned Employee</span>
                <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/employees/${agent.employee_id}`)}>
                  {agent.employee_name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Agent Version</span>
                <span className="font-mono text-text-primary">{agent.agent_version}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Operating System</span>
                <span className="text-text-primary">{agent.os}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Hardware</span>
                <span className="text-text-primary">{agent.cpu} • {agent.ram}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">IP Address</span>
                <span className="font-mono text-text-primary">{agent.ip}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">MAC Address</span>
                <span className="font-mono text-text-primary">{agent.mac}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Last Heartbeat</span>
                <span className="text-text-primary">{new Date(agent.last_heartbeat).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'})}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Risk Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success-background px-2 py-1 rounded border border-success/20">
                  <CheckCircle2 size={12} /> Secure
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2 border-b border-border pb-4">
              <Activity size={20} className="text-text-secondary" /> Live Telemetry
            </h3>
            <div className="text-text-disabled text-sm text-center py-8">
              Live telemetry stream connected. Waiting for agent events...
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-sidebar border border-border rounded-xl shadow-sm p-6">
             <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <TerminalSquare size={16} /> Quick Actions
            </h3>
            <div className="space-y-2">
               <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Shield size={16} className="text-primary" /> Run Malware Scan
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Activity size={16} className="text-secondary" /> Collect Forensics
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Power size={16} className="text-text-secondary" /> Restart Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
