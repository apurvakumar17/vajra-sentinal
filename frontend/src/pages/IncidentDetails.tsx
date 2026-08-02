import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { ArrowLeft, ShieldAlert, BrainCircuit, ExternalLink, Activity, TerminalSquare, Lock, LogOut, Clock, CheckCircle2 } from 'lucide-react'

export default function IncidentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { data: incidents, isLoading } = useQuery({ queryKey: ['incidents'], queryFn: api.getIncidents })
  
  if (isLoading) return <div className="p-8 text-text-secondary">Loading...</div>
  
  const incident = incidents?.find((i: any) => i.id === id)
  if (!incident) return <div className="p-8 text-center text-text-secondary">Incident not found.</div>

  const alert = incident.alert

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 space-y-6">
      
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/alerts')}
          className="p-2 hover:bg-surface rounded-lg text-text-secondary hover:text-text-primary transition-colors border border-transparent hover:border-border"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-text-secondary">
          <span className="cursor-pointer hover:text-text-primary" onClick={() => navigate('/alerts')}>Alerts & Incidents</span>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{incident.id}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${alert.severity === 'Critical' ? 'bg-[#D15C43]' : 'bg-primary'}`}></div>
            <div className="p-8 pl-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert className={alert.severity === 'Critical' ? 'text-[#D15C43]' : 'text-primary'} size={28} />
                    <h1 className="text-2xl font-bold text-text-primary">{alert.severity} Incident</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${alert.severity === 'Critical' ? 'bg-[#D15C43]/10 text-[#D15C43] border-[#D15C43]/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      {alert.severity} Risk
                    </span>
                  </div>
                  <p className="text-text-primary font-medium text-lg mt-4">{alert.reason}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center gap-2">
              <BrainCircuit className="text-primary" size={20} />
              <h3 className="font-bold text-text-primary">AI Explanation</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">Reasoning</h4>
                <p className="text-sm text-text-primary">{alert.ai_reasoning?.Reason || 'No AI reasoning provided.'}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">Evidence</h4>
                <p className="text-sm text-text-primary font-mono bg-background p-3 rounded-lg border border-border">
                  {alert.ai_reasoning?.Evidence || 'No evidence extracted.'}
                </p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">MITRE ATT&CK</h4>
                <p className="text-sm font-mono text-primary font-bold cursor-pointer hover:underline flex items-center gap-1">
                  {alert.ai_reasoning?.MITRE || 'Unmapped'} <ExternalLink size={14} />
                </p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-2">Confidence</h4>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-background rounded-full h-2.5 border border-border overflow-hidden">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: alert.ai_reasoning?.Confidence || '0%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{alert.ai_reasoning?.Confidence || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-sidebar flex items-center gap-2">
              <Clock className="text-text-secondary" size={20} />
              <h3 className="font-bold text-text-primary">Audit Trail & Timeline</h3>
            </div>
            <div className="p-6">
               <div className="relative pl-4 border-l-2 border-border space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-border ring-4 ring-surface"></div>
                    <p className="text-xs text-text-secondary mb-1">Just Now</p>
                    <p className="text-sm font-bold text-text-primary">Viewed by Analyst</p>
                    <p className="text-xs text-text-secondary mt-1">You opened this incident.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-[#D15C43] ring-4 ring-surface"></div>
                    <p className="text-xs text-text-secondary mb-1">{new Date(incident.created_at).toLocaleString()}</p>
                    <p className="text-sm font-bold text-[#D15C43]">Incident Created</p>
                    <p className="text-xs text-text-secondary mt-1">System promoted alert to active incident.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-border ring-4 ring-surface"></div>
                    <p className="text-xs text-text-secondary mb-1">{new Date(alert.created_at).toLocaleString()}</p>
                    <p className="text-sm font-bold text-text-primary">Alert Triggered</p>
                    <p className="text-xs text-text-secondary mt-1">Risk engine fired alert ALT-9001.</p>
                  </div>
               </div>
            </div>
          </div>
          
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          
          {/* Affected Employee */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 cursor-pointer hover:border-[#D4D2CC] transition-colors" onClick={() => navigate(`/employees/${incident.employee_id}`)}>
            <h3 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-4">Affected Employee</h3>
            <div className="flex items-center gap-4">
              {incident.employee?.photo_url ? (
                <img src={incident.employee.photo_url} alt="" className="h-12 w-12 rounded-xl object-cover shadow-sm border border-border" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center font-bold text-secondary text-lg border border-secondary/20">?</div>
              )}
              <div>
                <p className="font-bold text-text-primary">{incident.employee?.full_name}</p>
                <p className="text-sm text-text-secondary">{incident.employee?.department} • {incident.employee?.role}</p>
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <h3 className="text-xs uppercase tracking-wider font-bold text-text-disabled mb-4">Incident Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Status</span>
                <span className="text-sm font-bold text-text-primary capitalize">{incident.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Assigned To</span>
                <span className="text-sm font-bold text-text-primary">{incident.assigned_analyst}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-text-secondary">Created At</span>
                <span className="text-sm font-bold text-text-primary">{new Date(incident.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Alert ID</span>
                <span className="text-sm font-bold text-text-primary">{incident.alert_id}</span>
              </div>
            </div>
          </div>

          {/* Remote Response Actions */}
          <div className="bg-sidebar border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <TerminalSquare size={16} /> Remote Response
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Lock size={16} className="text-primary" /> Lock Workstation
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <LogOut size={16} className="text-[#D15C43]" /> Force Logout Session
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-background transition-colors text-sm font-medium flex items-center gap-3 shadow-sm text-text-primary">
                <Activity size={16} className="text-text-secondary" /> Kill Associated Process
              </button>
              <div className="pt-4 mt-4 border-t border-border">
                <button className="w-full text-center px-4 py-2.5 rounded-lg border border-success/20 bg-success-background text-success hover:bg-success/20 transition-colors text-sm font-bold shadow-sm flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Mark as Resolved
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
