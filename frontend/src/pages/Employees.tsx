import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Shield, MonitorSmartphone, Search, Filter } from 'lucide-react'

export default function Employees() {
  const navigate = useNavigate()
  const { data: employees, isLoading } = useQuery({ queryKey: ['employees'], queryFn: api.getEmployees })

  if (isLoading) return <div className="p-8 text-text-disabled text-center animate-pulse">Loading Employees...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Employees & Contractors</h1>
          <p className="text-text-secondary mt-1">Investigate user risk profiles and behavioral baselines.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" size={18} />
            <input 
              type="text" 
              placeholder="Search directory..."
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
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Employee</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Role & Dept</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Status</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Device</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp: any) => (
                <tr 
                  key={emp.id} 
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="border-b border-border hover:bg-background cursor-pointer transition-colors"
                >
                  <td className="p-4 flex items-center gap-4">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt={emp.full_name} className="h-10 w-10 rounded-full object-cover shadow-sm border border-border" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-bold text-secondary border border-secondary/20">
                        {emp.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-text-primary">{emp.full_name}</div>
                      <div className="text-sm text-text-secondary">{emp.email}</div>
                    </div>
                  </td>
                  <td className="p-4 text-text-secondary">
                    <div className="font-medium text-text-primary">{emp.role}</div>
                    <div className="text-sm">{emp.department}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${emp.current_status === 'online' ? 'bg-success' : 'bg-text-disabled'}`}></span>
                      <span className="text-sm capitalize font-medium text-text-primary">{emp.current_status || 'Offline'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-text-primary font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <MonitorSmartphone size={16} className="text-text-secondary" />
                      {emp.device_id || 'Unassigned'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex px-3 py-1 rounded text-xs font-bold border ${
                      emp.risk_score > 60 ? 'bg-primary/10 text-primary border-primary/20' : 
                      emp.risk_score > 30 ? 'bg-[#D15C43]/10 text-[#D15C43] border-[#D15C43]/20' : 
                      'bg-secondary/10 text-secondary border-secondary/20'
                    }`}>
                      {emp.risk_score} Score
                    </span>
                  </td>
                </tr>
              ))}
              {(!employees || employees.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-disabled">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
