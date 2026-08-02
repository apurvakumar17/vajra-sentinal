import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import { toast } from 'sonner'
import { 
  ArrowLeft, Shield, MonitorSmartphone, Activity, Clock, 
  LogOut, TerminalSquare, AlertTriangle, CheckCircle2, 
  ChevronRight, BarChart3, Network, Usb, Info, 
  Lock, Laptop, RefreshCw, Eye, X, Loader2, AlertCircle, FileText, CheckCircle
} from 'lucide-react'
import { 
  LineChart, AreaChart, BarChart
} from 'recharts'

function EmptyState({ title, message, icon: Icon }: { title: string, message: string, icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-background/50 rounded-lg border border-border/50 border-dashed h-full min-h-[200px]">
      <Icon className="w-10 h-10 text-text-disabled mb-3" />
      <h3 className="text-text-primary font-semibold mb-1">{title}</h3>
      <p className="text-text-secondary text-sm max-w-[250px]">{message}</p>
    </div>
  )
}

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Modal states
  const [activeModal, setActiveModal] = useState<'lock' | 'logout' | 'kill' | 'forensics' | 'restart' | null>(null)
  const [killProcessName, setKillProcessName] = useState('notepad.exe')
  const [killPid, setKillPid] = useState<string>('')
  const [forensicsDepth, setForensicsDepth] = useState('standard')
  const [selectedTaskResult, setSelectedTaskResult] = useState<any | null>(null)

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Queries
  const { data: employee, isLoading: empLoading } = useQuery({ 
    queryKey: ['employee', id], 
    queryFn: () => api.getEmployee(id!) 
  })
  
  const { data: alerts, isLoading: alertsLoading } = useQuery({ 
    queryKey: ['alerts'], 
    queryFn: api.getAlerts 
  })

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.getTasks({ employee_id: id }),
    refetchInterval: 3000
  })

  const { data: auditLogsData } = useQuery({
    queryKey: ['auditLogs', id],
    queryFn: () => api.getAuditLogs({ employee_id: id }),
    refetchInterval: 5000
  })

  const { data: telemetryData } = useQuery({
    queryKey: ['telemetry', employee?.device?.id],
    queryFn: () => api.getLiveTelemetry(employee?.device?.id!),
    enabled: !!employee?.device?.id,
    refetchInterval: 5000
  })

  // Listen to WebSocket for real-time task updates
  const wsData = useWebSocket('/api/v1/ws/dashboard')

  useEffect(() => {
    if (wsData && wsData.type === 'task_update') {
      const updatedTask = wsData.data
      if (updatedTask.employee_id === id || updatedTask.device_id === employee?.device?.id) {
        queryClient.invalidateQueries({ queryKey: ['employee', id] })
        queryClient.invalidateQueries({ queryKey: ['tasks', id] })
        queryClient.invalidateQueries({ queryKey: ['auditLogs', id] })

        if (updatedTask.status === 'Completed') {
          toast.success(`Task Completed: ${updatedTask.action || updatedTask.command}`, {
            description: `Executed successfully on ${employee?.device?.hostname || 'device'}`
          })
        } else if (updatedTask.status === 'Failed') {
          toast.error(`Task Failed: ${updatedTask.action || updatedTask.command}`, {
            description: `Execution failed on endpoint`
          })
        }
      }
    }
  }, [wsData, id, employee, queryClient])

  if (empLoading || alertsLoading) {
    return <div className="p-8 text-center text-text-disabled animate-pulse">Loading Employee Profile...</div>
  }

  if (!employee) {
    return <div className="p-8 text-center text-text-secondary">Employee not found.</div>
  }

  const employeeAlerts = alerts?.filter((a: any) => a.employee_id === id) || []
  const openIncidents = employeeAlerts.filter((a: any) => a.status === 'open' || a.status === 'investigating')
  const agent = employee.device
  const isAgentInstalled = !!agent
  const isAgentOnline = agent?.status === 'online'

  const employeeTasks = tasksData || employee.tasks || []
  const employeeAudits = auditLogsData || employee.audit_logs || []

  const highRiskAlert = openIncidents.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  // Handler for dispatching task actions
  const handleExecuteAction = async (actionType: 'lock' | 'logout' | 'kill' | 'forensics' | 'restart') => {
    if (!isAgentInstalled) {
      toast.error('Endpoint Agent Not Installed', {
        description: 'Quick actions require the Sentinel Endpoint Agent to be installed on the user device.'
      })
      return
    }

    setActionLoading(actionType)
    const toastId = toast.loading('Initiating Quick Action...')
    
    try {
      let res: any = null
      let actionName = ''

      if (actionType === 'lock') {
        actionName = 'Lock Workstation'
        res = await api.lockWorkstation({ employee_id: id, device_id: agent.id })
      } else if (actionType === 'logout') {
        actionName = 'Force Logout'
        res = await api.forceLogout({ employee_id: id, device_id: agent.id })
      } else if (actionType === 'kill') {
        actionName = 'Kill Process'
        res = await api.killProcess({ 
          employee_id: id, 
          device_id: agent.id, 
          process_name: killProcessName, 
          pid: killPid ? parseInt(killPid, 10) : undefined 
        })
      } else if (actionType === 'forensics') {
        actionName = 'Collect Forensics'
        res = await api.collectForensics({ employee_id: id, device_id: agent.id, depth: forensicsDepth })
      } else if (actionType === 'restart') {
        actionName = 'Restart Agent'
        res = await api.restartAgent({ employee_id: id, device_id: agent.id })
      }

      setActiveModal(null)

      if (res.status === 'sent') {
        toast.success(`Task Dispatched: ${actionName}`, {
          id: toastId,
          description: `Dispatched immediately via WebSocket to ${agent.hostname}.`
        })
      } else {
        toast.warning(`Task Queued: ${actionName}`, {
          id: toastId,
          description: `Endpoint is currently offline. Command queued and will execute when the agent reconnects.`
        })
      }

      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['auditLogs', id] })

    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to dispatch task'
      toast.error('Action Failed', { id: toastId, description: msg })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 space-y-6">
      
      {/* Navigation & Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-surface rounded-lg text-text-secondary hover:text-text-primary transition-colors border border-transparent hover:border-border"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center text-sm text-text-secondary font-medium">
          <span className="hover:text-text-primary cursor-pointer" onClick={() => navigate('/employees')}>Employees</span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-text-primary">{employee.full_name}</span>
        </div>
      </div>

      {/* Employee Header */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row md:items-stretch">
        
        {/* Left Profile Section */}
        <div className="p-8 border-b md:border-b-0 md:border-r border-border flex-1">
          <div className="flex items-start gap-6">
            <div className="relative">
              {employee.photo_url ? (
                <img src={employee.photo_url} alt={employee.full_name} className="h-24 w-24 rounded-2xl object-cover shadow-sm border border-border" />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-secondary/10 flex items-center justify-center text-2xl font-bold text-secondary border border-secondary/20">
                  {employee.full_name.charAt(0)}
                </div>
              )}
              {isAgentInstalled && (
                <div 
                  className={`absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-4 border-surface flex items-center justify-center ${isAgentOnline ? 'bg-success' : 'bg-text-disabled'}`} 
                  title={isAgentOnline ? 'Online' : 'Offline'}
                >
                  <span className={`h-2 w-2 rounded-full ${isAgentOnline ? 'bg-white animate-ping' : ''}`}></span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary mb-1">{employee.full_name}</h1>
                  <p className="text-text-secondary font-medium">{employee.role} • {employee.department}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-disabled mb-1">Risk Trend</span>
                    <span className="text-sm font-bold text-[#D15C43]">↑ +12% this week</span>
                  </div>
                  <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${employee.risk_score > 60 ? 'bg-primary/5 border-primary/20 text-primary' : employee.risk_score > 30 ? 'bg-[#D15C43]/5 border-[#D15C43]/20 text-[#D15C43]' : 'bg-success-background border-success/20 text-success'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1">Risk Score</span>
                    <span className="text-2xl font-bold flex items-center gap-1">
                      <Shield size={20} /> {employee.risk_score}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div>
                  <div className="text-xs text-text-disabled uppercase tracking-wider font-bold mb-1">Employee ID</div>
                  <div className="text-sm font-medium text-text-primary">{employee.id}</div>
                </div>
                <div>
                  <div className="text-xs text-text-disabled uppercase tracking-wider font-bold mb-1">Email</div>
                  <div className="text-sm font-medium text-text-primary">{employee.email}</div>
                </div>
                <div>
                  <div className="text-xs text-text-disabled uppercase tracking-wider font-bold mb-1">Agent Status</div>
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    {isAgentInstalled ? (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${isAgentOnline ? 'bg-success/10 text-success border border-success/20' : 'bg-text-disabled/10 text-text-disabled border border-border'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isAgentOnline ? 'bg-success' : 'bg-text-disabled'}`}></span>
                        {isAgentOnline ? 'Online' : 'Offline'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Not Installed
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-disabled uppercase tracking-wider font-bold mb-1">Last Action</div>
                  <div className="text-sm font-medium text-text-primary">
                    {employee.last_command || agent?.last_command || 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions Section */}
        <div className="w-full md:w-[320px] bg-sidebar p-6 flex flex-col justify-between border-t md:border-t-0 border-border">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <TerminalSquare size={16} /> Quick Actions
              </h3>
              {!isAgentInstalled && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Agent Required
                </span>
              )}
            </div>

            {!isAgentInstalled && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>Endpoint agent is not installed on this employee's machine. Quick actions are disabled.</span>
              </div>
            )}

            <div className="space-y-2">
              <button 
                onClick={() => setActiveModal('lock')}
                disabled={!isAgentInstalled || !!actionLoading}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-between shadow-sm text-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  <span>Lock Workstation</span>
                </div>
                {actionLoading === 'lock' && <Loader2 size={16} className="animate-spin text-primary" />}
              </button>

              <button 
                onClick={() => setActiveModal('logout')}
                disabled={!isAgentInstalled || !!actionLoading}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-between shadow-sm text-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={16} className="text-[#D15C43] group-hover:scale-110 transition-transform" />
                  <span>Force Logout</span>
                </div>
                {actionLoading === 'logout' && <Loader2 size={16} className="animate-spin text-[#D15C43]" />}
              </button>

              <button 
                onClick={() => setActiveModal('kill')}
                disabled={!isAgentInstalled || !!actionLoading}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-between shadow-sm text-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-text-secondary group-hover:scale-110 transition-transform" />
                  <span>Kill Process</span>
                </div>
                {actionLoading === 'kill' && <Loader2 size={16} className="animate-spin text-text-secondary" />}
              </button>

              <button 
                onClick={() => setActiveModal('forensics')}
                disabled={!isAgentInstalled || !!actionLoading}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-between shadow-sm text-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <Info size={16} className="text-text-secondary group-hover:scale-110 transition-transform" />
                  <span>Collect Forensics</span>
                </div>
                {actionLoading === 'forensics' && <Loader2 size={16} className="animate-spin text-text-secondary" />}
              </button>

              <button 
                onClick={() => setActiveModal('restart')}
                disabled={!isAgentInstalled || !!actionLoading}
                className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center justify-between shadow-sm text-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-text-secondary group-hover:scale-110 transition-transform" />
                  <span>Restart Agent</span>
                </div>
                {actionLoading === 'restart' && <Loader2 size={16} className="animate-spin text-text-secondary" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Summary Panel */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-secondary"></div>
              <h3 className="font-bold text-text-primary">AI Summary</h3>
            </div>
            <div className="p-6">
              {highRiskAlert ? (
                <div className="space-y-4">
                  <p className="text-text-primary leading-relaxed">
                    <strong>Behavior & Risk:</strong> User's risk score increased by 40 points in the last 2 hours. {highRiskAlert.reason}
                  </p>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                    <h4 className="font-bold text-primary text-sm flex items-center gap-2">
                      <AlertTriangle size={16} /> Recommended Investigation Steps
                    </h4>
                    <ul className="list-disc list-inside text-sm text-text-secondary space-y-1 ml-1">
                      <li>Review file access logs on <span className="font-mono text-xs bg-background px-1 py-0.5 rounded border border-border">/SourceCode</span> for the past 24 hours.</li>
                      <li>Force terminate current user session to prevent potential data exfiltration.</li>
                      <li>Analyze process tree for unusual child processes spawned by browser or office applications.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-text-secondary">
                  <CheckCircle2 className="text-success" size={20} />
                  <span>No elevated risk behaviors detected. User profile is currently within normal baselines.</span>
                </div>
              )}
            </div>
          </div>

          {/* Task Command History Section */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalSquare size={18} className="text-primary" />
                <h3 className="font-bold text-text-primary">Task & Action Execution History</h3>
              </div>
              <span className="text-xs font-medium text-text-secondary">{employeeTasks.length} total tasks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Task ID</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Action</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Status</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Issued At</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Issued By</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeTasks.length > 0 ? (
                    employeeTasks.map((t: any) => (
                      <tr key={t.id} className="border-b border-border hover:bg-background/50 transition-colors">
                        <td className="p-4 text-xs font-mono font-bold text-text-primary">{t.id}</td>
                        <td className="p-4 text-sm font-semibold text-text-primary">{t.action || t.command}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border ${
                            t.status === 'Completed' ? 'bg-success/10 text-success border-success/20' :
                            t.status === 'Sent' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            t.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {t.status === 'Completed' && <CheckCircle size={12} />}
                            {t.status === 'Sent' && <Loader2 size={12} className="animate-spin" />}
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-text-secondary whitespace-nowrap">
                          {new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="p-4 text-xs font-medium text-text-secondary">{t.admin_id || t.created_by || 'Admin'}</td>
                        <td className="p-4">
                          {t.result ? (
                            <button
                              onClick={() => setSelectedTaskResult(t)}
                              className="px-2.5 py-1 bg-background hover:bg-surface border border-border rounded text-xs font-medium text-primary flex items-center gap-1 transition-colors"
                            >
                              <FileText size={12} /> View Result
                            </button>
                          ) : (
                            <span className="text-xs text-text-disabled italic">Awaiting completion</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-disabled">
                        No agent tasks executed for this employee yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-secondary" />
                <h3 className="font-bold text-text-primary">Admin Audit Log</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Timestamp</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Admin</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Action</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeAudits.length > 0 ? (
                    employeeAudits.map((log: any, index: number) => (
                      <tr key={log.id || index} className="border-b border-border hover:bg-background/50 transition-colors">
                        <td className="p-4 text-xs whitespace-nowrap text-text-secondary">
                          {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="p-4 text-xs font-bold text-text-primary">{log.admin || log.user_id}</td>
                        <td className="p-4 text-sm font-medium text-text-primary">{log.action}</td>
                        <td className="p-4 text-xs font-semibold text-text-secondary">{log.result || 'Executed'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-text-disabled">No audit records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Incidents */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center justify-between">
              <h3 className="font-bold text-text-primary">Open Incidents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Incident ID</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Created Time</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Status</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Assigned Analyst</th>
                  </tr>
                </thead>
                <tbody>
                  {openIncidents.length > 0 ? (
                    openIncidents.map((incident: any) => (
                      <tr key={incident.id} className="border-b border-border hover:bg-background/50 transition-colors">
                        <td className="p-4 text-sm font-bold text-text-primary">INC-{incident.id.split('-')[1]}</td>
                        <td className="p-4 text-sm whitespace-nowrap text-text-secondary">
                          {new Date(incident.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold border bg-secondary/10 text-secondary border-secondary/20 capitalize">
                            {incident.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-text-primary">Unassigned</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-text-disabled">No open incidents found for this employee.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Alerts Table */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-sidebar">
              <h3 className="font-bold text-text-primary">Recent Alerts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Time</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Severity</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Reason</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Status</th>
                    <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeAlerts.length > 0 ? (
                    employeeAlerts.map((alert: any) => (
                      <tr key={alert.id} className="border-b border-border hover:bg-background/50 transition-colors">
                        <td className="p-4 text-sm whitespace-nowrap text-text-secondary">
                          {new Date(alert.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${
                            alert.severity === 'Critical' ? 'bg-primary/10 text-primary border-primary/20' : 
                            alert.severity === 'High' ? 'bg-[#D15C43]/10 text-[#D15C43] border-[#D15C43]/20' : 
                            'bg-secondary/10 text-secondary border-secondary/20'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-text-primary max-w-sm truncate" title={alert.reason}>
                          {alert.reason}
                        </td>
                        <td className="p-4 text-sm capitalize font-medium text-text-secondary">
                          {alert.status}
                        </td>
                        <td className="p-4 text-sm font-medium text-text-primary">
                          {alert.confidence || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-disabled">No alerts found for this employee.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          
          {/* Device Information */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Laptop size={18} className="text-secondary" /> Device Information
            </h3>
            <div className="space-y-4">
              {agent ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Hostname</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{agent.hostname}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">OS</span>
                    <span className="text-sm font-bold text-text-primary">{agent.os || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">IP Address</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{agent.ip || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">MAC Address</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{agent.mac || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Last Command</span>
                    <span className="text-sm font-bold text-primary font-medium">{agent.last_command || employee.last_command || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-text-secondary">Last Execution</span>
                    <span className="text-sm font-bold text-text-primary">
                      {agent.last_execution_time ? new Date(agent.last_execution_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-disabled italic">No associated agent found.</p>
              )}
            </div>
          </div>

          {/* Behavior Baseline */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Activity size={18} className="text-secondary" /> Behavior Baseline
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Normal Login Hours</span>
                <span className="text-sm font-bold text-text-primary">08:00 - 17:00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Normal Working Days</span>
                <span className="text-sm font-bold text-text-primary">Mon - Fri</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Typical Applications</span>
                <span className="text-sm font-bold text-text-primary">Chrome, Outlook, VSCode</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">USB Usage</span>
                <span className="text-sm font-bold text-text-primary">Restricted Policy</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Clock size={18} className="text-secondary" /> Activity Timeline
            </h3>
            <div className="relative pl-4 border-l-2 border-border space-y-6 mt-4">
              {telemetryData?.telemetry?.length > 0 ? (
                telemetryData.telemetry.slice(0, 10).map((t: any, idx: number) => (
                  <div key={t.id || idx} className="relative">
                    <div className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-surface ${['Critical', 'High'].includes(t.severity) ? 'bg-[#D15C43]' : 'bg-secondary'}`}></div>
                    <p className="text-xs text-text-secondary mb-1">{new Date(t.timestamp).toLocaleTimeString()}</p>
                    <p className="text-sm font-bold text-text-primary">{t.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-text-secondary mt-1">{t.description}</p>
                  </div>
                ))
              ) : (
                <div className="relative">
                   <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-success ring-4 ring-surface"></div>
                   <p className="text-xs text-text-secondary mb-1">Today</p>
                   <p className="text-sm font-bold text-text-primary">No Activity</p>
                   <p className="text-xs text-text-secondary mt-1">Waiting for telemetry from agent.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal - Lock Workstation */}
      {activeModal === 'lock' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Lock size={24} />
              <h3 className="text-lg font-bold text-text-primary">Lock Workstation</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to lock the workstation for <strong className="text-text-primary">{employee.full_name}</strong> on device <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border text-xs">{agent?.hostname}</span>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleExecuteAction('lock')}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium flex items-center gap-2"
              >
                {actionLoading === 'lock' && <Loader2 size={16} className="animate-spin" />}
                Confirm Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Force Logout */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-[#D15C43]">
              <LogOut size={24} />
              <h3 className="text-lg font-bold text-text-primary">Force Logout User</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Warning: Forcing logout will immediately terminate the user session for <strong className="text-text-primary">{employee.full_name}</strong>. Unsaved work will be lost.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleExecuteAction('logout')}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-lg bg-[#D15C43] hover:bg-[#D15C43]/90 text-white text-sm font-medium flex items-center gap-2"
              >
                {actionLoading === 'logout' && <Loader2 size={16} className="animate-spin" />}
                Force Logout Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Kill Process */}
      {activeModal === 'kill' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3 text-text-primary">
                <Activity size={24} className="text-primary" />
                <h3 className="text-lg font-bold">Kill Endpoint Process</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-text-disabled hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-text-disabled mb-1">Process Name</label>
                <input 
                  type="text" 
                  value={killProcessName}
                  onChange={(e) => setKillProcessName(e.target.value)}
                  placeholder="e.g. chrome.exe or powershell.exe"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-text-disabled mb-1">Process PID (Optional)</label>
                <input 
                  type="text" 
                  value={killPid}
                  onChange={(e) => setKillPid(e.target.value)}
                  placeholder="e.g. 4820"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleExecuteAction('kill')}
                disabled={!!actionLoading || (!killProcessName && !killPid)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === 'kill' && <Loader2 size={16} className="animate-spin" />}
                Kill Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Collect Forensics */}
      {activeModal === 'forensics' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-secondary">
              <Info size={24} />
              <h3 className="text-lg font-bold text-text-primary">Collect Forensics Package</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              This will request the endpoint agent to take a snapshot of running processes, active network connections, file access handles, and memory state.
            </p>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-text-disabled mb-1">Depth level</label>
              <select 
                value={forensicsDepth}
                onChange={(e) => setForensicsDepth(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="standard">Standard Snapshot (Processes + Sockets + CPU/Mem)</option>
                <option value="deep">Deep Forensic Inspection (Full Process Tree + Handles)</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleExecuteAction('forensics')}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/90 text-white text-sm font-medium flex items-center gap-2"
              >
                {actionLoading === 'forensics' && <Loader2 size={16} className="animate-spin" />}
                Collect Forensics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Restart Agent */}
      {activeModal === 'restart' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-text-primary">
              <RefreshCw size={24} className="text-secondary" />
              <h3 className="text-lg font-bold">Restart Endpoint Agent</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to restart the Sentinel Endpoint Agent service on <strong className="text-text-primary">{agent?.hostname}</strong>? The agent will briefly disconnect and reconnect.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleExecuteAction('restart')}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/90 text-white text-sm font-medium flex items-center gap-2"
              >
                {actionLoading === 'restart' && <Loader2 size={16} className="animate-spin" />}
                Restart Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Result Inspection Modal */}
      {selectedTaskResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <TerminalSquare size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-text-primary">
                  Task Result Details: {selectedTaskResult.action || selectedTaskResult.command}
                </h3>
              </div>
              <button onClick={() => setSelectedTaskResult(null)} className="text-text-disabled hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm flex-1 overflow-auto">
              <div className="grid grid-cols-2 gap-4 bg-background p-3 rounded-lg border border-border">
                <div>
                  <span className="text-xs text-text-disabled uppercase font-bold">Task ID</span>
                  <p className="font-mono text-xs font-bold">{selectedTaskResult.id}</p>
                </div>
                <div>
                  <span className="text-xs text-text-disabled uppercase font-bold">Status</span>
                  <p className="font-bold text-success">{selectedTaskResult.status}</p>
                </div>
                <div>
                  <span className="text-xs text-text-disabled uppercase font-bold">Completed At</span>
                  <p>{selectedTaskResult.completed_at ? new Date(selectedTaskResult.completed_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-text-disabled uppercase font-bold">Issued By</span>
                  <p>{selectedTaskResult.admin_id || selectedTaskResult.created_by || 'Admin'}</p>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase font-bold text-text-disabled mb-1 block">Output Payload</span>
                <pre className="p-4 bg-background border border-border rounded-lg text-xs font-mono text-text-primary overflow-x-auto max-h-[300px]">
                  {JSON.stringify(selectedTaskResult.result || selectedTaskResult, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button 
                onClick={() => setSelectedTaskResult(null)}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
