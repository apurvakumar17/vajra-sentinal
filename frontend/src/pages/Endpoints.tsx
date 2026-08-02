import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { MonitorSmartphone, Shield, Power, LogOut, TerminalSquare, Activity, Download, HardDrive, Wifi, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function Endpoints() {
  const navigate = useNavigate()
  const { data: agents, isLoading, refetch } = useQuery({ queryKey: ['endpoints'], queryFn: api.getEndpoints })
  
  const sendCommandMutation = useMutation({
    mutationFn: ({ agentId, command }: { agentId: string, command: any }) => api.sendCommand(agentId, command),
    onMutate: () => {
      const toastId = toast.loading('Initiating Quick Action...')
      return { toastId }
    },
    onSuccess: (data, variables, context) => {
      if (data.status === 'sent') {
        toast.success('Task Dispatched', {
          id: context?.toastId,
          description: data.message || 'Command sent successfully.'
        })
      } else {
        toast.warning('Task Queued', {
          id: context?.toastId,
          description: 'Endpoint is currently offline. Command queued and will execute when the agent reconnects.'
        })
      }
    },
    onError: (error: any, variables, context) => {
      const msg = error?.response?.data?.detail || error.message || 'Failed to dispatch task'
      toast.error('Action Failed', { id: context?.toastId, description: msg })
    }
  })

  const handleCommand = (agentId: string, action: string) => {
    sendCommandMutation.mutate({ agentId, command: { command: action } })
  }

  if (isLoading) return <div className="p-8 text-text-disabled text-center animate-pulse">Loading Endpoints...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Endpoint Management</h1>
          <p className="text-text-secondary mt-1">Monitor and control deployed Sentinel Agents.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/v1/employee/agent/download"
            target="_blank"
            rel="noreferrer"
            className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Download size={16}/> Download Agent
          </a>
          <button 
            onClick={() => refetch()} 
            className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Activity size={16}/> Refresh Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents?.map((agent: any) => (
          <div key={agent.id} onClick={() => navigate(`/endpoints/${agent.id}`)} className="cursor-pointer bg-surface border border-border rounded-xl flex flex-col hover:border-[#D4D2CC] hover:shadow-md transition-all duration-200 overflow-hidden shadow-sm">
            
            <div className="p-6 border-b border-border/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${agent.status === 'online' ? 'bg-success-background text-success border-success/20' : 'bg-background text-text-secondary border-border'}`}>
                    <MonitorSmartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">{agent.hostname}</h3>
                    <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                      <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'animate-pulse bg-success' : 'bg-text-disabled'}`}></span>
                      <span className="capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 bg-background flex-1 text-sm border-b border-border/50">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Assigned To</span>
                    <span 
                      className="font-medium text-primary hover:underline cursor-pointer"
                      onClick={() => navigate(`/employees/${agent.employee_id}`)}
                    >
                      {agent.employee_name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Agent Version</span>
                    <span className="font-mono text-text-primary">{agent.agent_version}</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1 flex items-center gap-1"><HardDrive size={12}/> OS / Specs</span>
                    <span className="text-text-primary block">{agent.os}</span>
                    <span className="text-text-secondary text-xs">{agent.ram} RAM • {agent.cpu}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1 flex items-center gap-1"><Wifi size={12}/> Network</span>
                    <span className="font-mono text-text-primary block">{agent.ip}</span>
                    <span className="font-mono text-text-secondary text-xs">{agent.mac}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1 flex items-center gap-1"><ShieldCheck size={12}/> Device Health</span>
                    <div className="flex items-center gap-1 text-success font-medium">
                      <CheckCircle2 size={14} /> AV Active
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-text-disabled block mb-1">Last Heartbeat</span>
                    <span className="text-text-primary font-medium">{new Date(agent.last_heartbeat).toLocaleTimeString()}</span>
                  </div>
               </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 bg-sidebar">
              <button 
                onClick={() => handleCommand(agent.id, 'lock_workstation')}
                className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 p-2 rounded-lg text-sm font-bold transition-colors"
              >
                <Shield size={14}/> Lock Device
              </button>
              <button 
                onClick={() => handleCommand(agent.id, 'restart_agent')}
                className="flex items-center justify-center gap-2 bg-surface border border-border hover:bg-background text-text-primary p-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                <Power size={14}/> Restart Agent
              </button>
            </div>
            
          </div>
        ))}
        {(!agents || agents.length === 0) && (
          <div className="col-span-full p-12 text-center text-text-disabled font-medium border border-dashed border-border rounded-xl bg-background">
            No endpoints connected.
          </div>
        )}
      </div>
    </div>
  )
}
