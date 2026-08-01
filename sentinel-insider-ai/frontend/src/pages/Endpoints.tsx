import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { MonitorSmartphone, Shield, Command, Power, LogOut, TerminalSquare } from 'lucide-react'
import { useState } from 'react'

export default function Endpoints() {
  const { data: agents, isLoading, refetch } = useQuery({ queryKey: ['agents'], queryFn: api.getAgents })
  
  const sendCommandMutation = useMutation({
    mutationFn: ({ agentId, command }: { agentId: string, command: any }) => api.sendCommand(agentId, command),
    onSuccess: () => alert('Command queued successfully')
  })

  const handleCommand = (agentId: string, action: string) => {
    sendCommandMutation.mutate({ agentId, command: { command: action } })
  }

  if (isLoading) return <div className="p-8 text-slate-400 text-center animate-pulse">Loading Endpoints...</div>

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Endpoint Management</h1>
        <button onClick={() => refetch()} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Activity size={18}/> Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents?.map((agent: any) => (
          <div key={agent.id} className="bg-dark border border-slate-800 rounded-xl p-6 flex flex-col hover:border-slate-700 transition-colors">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${agent.status === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                  <MonitorSmartphone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{agent.hostname}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                    {agent.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-800/50 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Agent ID</span>
                <span className="font-mono text-slate-300">{agent.agent_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Last Heartbeat</span>
                <span className="text-slate-300">{agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleCommand(agent.agent_id, 'lock_workstation')}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Shield size={16}/> Lock
              </button>
              <button 
                onClick={() => handleCommand(agent.agent_id, 'force_logout')}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 p-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut size={16}/> Logout
              </button>
              <button 
                onClick={() => handleCommand(agent.agent_id, 'restart_agent')}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Power size={16}/> Restart
              </button>
              <button 
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-accent/20 text-accent hover:text-accent-light p-2 rounded-lg text-sm font-medium transition-colors"
              >
                <TerminalSquare size={16}/> Console
              </button>
            </div>
            
          </div>
        ))}
        {(!agents || agents.length === 0) && (
          <div className="col-span-full p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-dark/50">
            No endpoints connected. Install the Sentinel Agent on a device to begin tracking.
          </div>
        )}
      </div>
    </div>
  )
}
