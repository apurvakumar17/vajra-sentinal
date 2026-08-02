import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { ShieldAlert, AlertTriangle, Search, Filter } from 'lucide-react'

export default function Alerts() {
  const navigate = useNavigate()
  const { data: incidents, isLoading } = useQuery({ queryKey: ['incidents'], queryFn: api.getIncidents })

  if (isLoading) return <div className="p-8 text-text-secondary">Loading incidents...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Alerts & Incidents</h1>
          <p className="text-text-secondary mt-1">Manage and investigate security events.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" size={18} />
            <input 
              type="text" 
              placeholder="Search incidents..."
              className="bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary w-64 shadow-sm"
            />
          </div>
          <button className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>
      
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">ID</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Severity</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Employee</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Reason</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Time</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Status</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Assigned Analyst</th>
              </tr>
            </thead>
            <tbody>
              {incidents?.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-text-disabled">No incidents found.</td></tr>
              ) : (
                incidents?.map((inc: any) => (
                  <tr 
                    key={inc.id} 
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="border-b border-border hover:bg-background cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-sm font-bold text-text-primary whitespace-nowrap">{inc.id}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${
                        inc.alert.severity === 'Critical' ? 'bg-[#D15C43]/10 text-[#D15C43] border-[#D15C43]/20' : 
                        inc.alert.severity === 'High' ? 'bg-primary/10 text-primary border-primary/20' : 
                        'bg-secondary/10 text-secondary border-secondary/20'
                      }`}>
                        {inc.alert.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {inc.employee?.photo_url ? (
                          <img src={inc.employee.photo_url} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">?</div>
                        )}
                        <span className="text-sm font-medium text-text-primary">{inc.employee?.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-primary max-w-md truncate" title={inc.alert.reason}>{inc.alert.reason}</td>
                    <td className="p-4 text-sm text-text-secondary whitespace-nowrap">{new Date(inc.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-4 text-sm capitalize text-text-secondary font-medium">{inc.status}</td>
                    <td className="p-4 text-sm text-text-primary">{inc.assigned_analyst}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
