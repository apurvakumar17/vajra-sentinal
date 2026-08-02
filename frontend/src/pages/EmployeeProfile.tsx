import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { 
  ArrowLeft, Shield, MonitorSmartphone, Activity, Clock, 
  LogOut, TerminalSquare, AlertTriangle, CheckCircle2, 
  ChevronRight, BarChart3, Network, Usb, Info, 
  Lock, Laptop, RefreshCw, Eye
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

  const { data: employee, isLoading: empLoading } = useQuery({ 
    queryKey: ['employee', id], 
    queryFn: () => api.getEmployee(id!) 
  })
  
  const { data: alerts, isLoading: alertsLoading } = useQuery({ 
    queryKey: ['alerts'], 
    queryFn: api.getAlerts 
  })
  
  const { data: telemetryData } = useQuery({
    queryKey: ['telemetry', employee?.device?.id],
    queryFn: () => api.getLiveTelemetry(employee?.device?.id!),
    enabled: !!employee?.device?.id,
    refetchInterval: 5000
  })

  if (empLoading || alertsLoading) {
    return <div className="p-8 text-center text-text-disabled animate-pulse">Loading Employee Profile...</div>
  }

  if (!employee) {
    return <div className="p-8 text-center text-text-secondary">Employee not found.</div>
  }

  const employeeAlerts = alerts?.filter((a: any) => a.employee_id === id) || []
  const openIncidents = employeeAlerts.filter((a: any) => a.status === 'open' || a.status === 'investigating')
  const agent = employee.device
  
  const highRiskAlert = openIncidents.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

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
              {agent && (
                <div className={`absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-4 border-surface flex items-center justify-center ${agent.status === 'online' ? 'bg-success' : 'bg-text-disabled'}`} title={agent.status === 'online' ? 'Online' : 'Offline'}>
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
                  <div className="text-xs text-text-disabled uppercase tracking-wider font-bold mb-1">Manager</div>
                  <div className="text-sm font-medium text-text-primary">Sarah Jenkins</div>
                </div>
                <div>
                  <div className="text-xs text-text-disabled uppercase tracking-wider font-bold mb-1">Current Session</div>
                  <div className="text-sm font-medium text-text-primary">{agent && agent.status === 'online' ? 'Active (Winlogon)' : 'Offline'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions Section */}
        <div className="w-full md:w-[320px] bg-sidebar p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <TerminalSquare size={16} /> Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Lock size={16} className="text-primary" /> Lock Workstation
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <LogOut size={16} className="text-[#D15C43]" /> Force Logout
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Activity size={16} className="text-text-secondary" /> Kill Process
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Info size={16} className="text-text-secondary" /> Collect Forensics
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <RefreshCw size={16} className="text-text-secondary" /> Restart Agent
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

          {/* AI Explanation Details */}
          {highRiskAlert && highRiskAlert.ai_reasoning && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-sidebar">
                <h3 className="font-bold text-text-primary">AI Explanation</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">Evidence</h4>
                  <p className="text-sm text-text-primary font-medium bg-background p-3 rounded-lg border border-border">
                    {highRiskAlert.ai_reasoning.Evidence}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">MITRE ATT&CK</h4>
                  <p className="text-sm text-text-primary font-medium bg-background p-3 rounded-lg border border-border font-mono text-xs">
                    {highRiskAlert.ai_reasoning.MITRE}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">Reasoning</h4>
                  <p className="text-sm text-text-secondary">
                    {highRiskAlert.ai_reasoning.Reason}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">Confidence Level</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-background rounded-full h-2.5 border border-border overflow-hidden">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: highRiskAlert.ai_reasoning.Confidence }}></div>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{highRiskAlert.ai_reasoning.Confidence}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk History */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center justify-between">
              <h3 className="font-bold text-text-primary">Risk History</h3>
            </div>
            <div className="p-6">
              <EmptyState title="No Risk History" message="Not enough historical risk score data to generate an interactive chart." icon={LineChart} />
            </div>
          </div>

          {/* Behavior Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Clock size={18} className="text-text-secondary" /> Login Heatmap
              </h3>
              <EmptyState title="Insufficient Logins" message="Need more authentication logs to build a reliable heatmap." icon={Activity} />
            </div>
            
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <LogOut size={18} className="text-text-secondary" /> File Access Trend
              </h3>
              <EmptyState title="No File Access Data" message="No recent file operations recorded for this user." icon={AreaChart} />
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Usb size={18} className="text-text-secondary" /> USB Trend
              </h3>
              <EmptyState title="No USB Activity" message="No recent peripheral connections recorded." icon={BarChart} />
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Network size={18} className="text-text-secondary" /> Network Upload Trend
              </h3>
              <EmptyState title="No Network Data" message="Network telemetry is missing or incomplete for this user." icon={AreaChart} />
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
          
          {/* Behavior Baseline */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Activity size={18} className="text-secondary" /> Behavior Baseline
            </h3>
            <div className="space-y-4">
              {employee.baseline_profile ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Normal Login Hours</span>
                    <span className="text-sm font-bold text-text-primary">{employee.baseline_profile.working_hours || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Normal Working Days</span>
                    <span className="text-sm font-bold text-text-primary">Mon - Fri</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Typical Applications</span>
                    <span className="text-sm font-bold text-text-primary text-right max-w-[120px] truncate" title="Chrome, Outlook, Excel, Teams">Chrome, Outlook...</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Avg Session Duration</span>
                    <span className="text-sm font-bold text-text-primary">8.5 hrs</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Normal USB Usage</span>
                    <span className="text-sm font-bold text-text-primary">None</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Normal Upload Vol</span>
                    <span className="text-sm font-bold text-text-primary">50 MB / day</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Normal Download Vol</span>
                    <span className="text-sm font-bold text-text-primary">{employee.baseline_profile.avg_daily_downloads || '0'} MB / day</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-text-secondary">Normal Sensitive Access</span>
                    <span className="text-sm font-bold text-text-primary">Rare</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-disabled italic">Baseline is still learning for this user.</p>
              )}
            </div>
          </div>

          {/* Current Activity */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Eye size={18} className="text-secondary" /> Current Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Logged In</span>
                <span className="text-sm font-bold text-text-primary">Yes (Local)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Active Application</span>
                <span className="text-sm font-bold text-text-primary">chrome.exe</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Running Processes</span>
                <span className="text-sm font-bold text-text-primary">142</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Network Activity</span>
                <span className="text-sm font-bold text-text-primary">Idle (12 Kbps)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">USB Devices</span>
                <span className="text-sm font-bold text-text-primary">1 (Blocked)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">File Operations</span>
                <span className="text-sm font-bold text-text-primary">0 / min</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Browser Metadata</span>
                <span className="text-sm font-bold text-text-primary">Standard</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Heartbeat</span>
                <span className="text-sm font-bold text-text-primary">
                  {agent ? new Date(agent.last_heartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

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
                    <span className="text-sm text-text-secondary">RAM</span>
                    <span className="text-sm font-bold text-text-primary">{agent.ram || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">CPU</span>
                    <span className="text-sm font-bold text-text-primary text-right max-w-[120px] truncate" title={agent.cpu}>{agent.cpu || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Antivirus</span>
                    <span className={`text-sm font-bold ${agent.antivirus_status === 'Active' ? 'text-success' : 'text-[#D15C43]'}`}>{agent.antivirus_status || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Firewall</span>
                    <span className={`text-sm font-bold ${agent.firewall_status === 'Enabled' ? 'text-success' : 'text-[#D15C43]'}`}>{agent.firewall_status || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">IP Address</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{agent.ip || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">MAC</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{agent.mac || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Agent Version</span>
                    <span className="text-sm font-bold text-text-primary font-mono">{agent.agent_version || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-text-secondary">Last Heartbeat</span>
                    <span className="text-sm font-bold text-text-primary">
                      {new Date(agent.last_heartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-disabled italic">No associated agent found.</p>
              )}
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
    </div>
  )
}
