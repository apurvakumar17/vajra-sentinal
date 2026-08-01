import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { MonitorSmartphone, Shield, Command, Power, LogOut, TerminalSquare, Activity } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Endpoints() {
  const { data: agents, isLoading, refetch } = useQuery({ queryKey: ['agents'], queryFn: api.getAgents })
  
  const sendCommandMutation = useMutation({
    mutationFn: ({ agentId, command }: { agentId: string, command: any }) => api.sendCommand(agentId, command),
    onSuccess: () => toast.success('Command queued successfully')
  })

  const handleCommand = (agentId: string, action: string) => {
    sendCommandMutation.mutate({ agentId, command: { command: action } })
  }

  if (isLoading) return <div className="p-8 text-text-disabled text-center animate-pulse" data-testid="endpoints-loading">Loading Endpoints...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto" data-testid="endpoints-page">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Endpoint Management</h1>
        <button 
          onClick={() => refetch()} 
          className="bg-surface border border-border hover:border-[#D4D2CC] hover:bg-sidebar text-text-primary px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm"
          data-testid="endpoints-refresh-btn"
        >
          <Activity size={18}/> Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents?.map((agent: any) => (
          <div key={agent.id} className="bg-surface border border-border rounded-lg p-6 flex flex-col hover:-translate-y-0.5 hover:shadow-md hover:border-[#D4D2CC] transition-all duration-200 shadow-sm" data-testid={`endpoint-card-${agent.id}`}>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg border ${agent.status === 'online' ? 'bg-success-background text-success border-success/20' : 'bg-background text-text-secondary border-border'}`}>
                  <MonitorSmartphone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-text-primary">{agent.hostname}</h3>
                  <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-success' : 'bg-text-disabled'}`}></span>
                    {agent.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-background p-4 rounded-lg border border-border text-sm shadow-inner">
              <div className="flex justify-between text-text-secondary">
                <span className="font-bold">Agent ID</span>
                <span className="font-body text-text-primary font-medium">{agent.agent_id}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span className="font-bold">Last Heartbeat</span>
                <span className="text-text-primary font-medium">{agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleCommand(agent.agent_id, 'lock_workstation')}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-text p-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                data-testid={`btn-lock-${agent.id}`}
              >
                <Shield size={16}/> Lock
              </button>
              <button 
                onClick={() => handleCommand(agent.agent_id, 'force_logout')}
                className="flex items-center justify-center gap-2 bg-surface border border-border hover:border-[#D4D2CC] hover:bg-sidebar text-text-primary p-2 rounded-lg text-sm font-bold transition-colors"
                data-testid={`btn-logout-${agent.id}`}
              >
                <LogOut size={16}/> Logout
              </button>
              <button 
                onClick={() => handleCommand(agent.agent_id, 'restart_agent')}
                className="flex items-center justify-center gap-2 bg-surface border border-border hover:border-[#D4D2CC] hover:bg-sidebar text-text-primary p-2 rounded-lg text-sm font-bold transition-colors"
                data-testid={`btn-restart-${agent.id}`}
              >
                <Power size={16}/> Restart
              </button>
              <button 
                className="flex items-center justify-center gap-2 bg-surface border border-border hover:border-[#D4D2CC] hover:bg-sidebar text-text-primary p-2 rounded-lg text-sm font-bold transition-colors"
                data-testid={`btn-console-${agent.id}`}
              >
                <TerminalSquare size={16}/> Console
              </button>
            </div>
            
          </div>
        ))}
        {(!agents || agents.length === 0) && (
          <div className="col-span-full p-12 text-center text-text-disabled font-medium border border-dashed border-border rounded-lg bg-background">
            No endpoints connected. Install the Sentinel Agent on a device to begin tracking.
          </div>
        )}
      </div>
    </div>
  )
}
