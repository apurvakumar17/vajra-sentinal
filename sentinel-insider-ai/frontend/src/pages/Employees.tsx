import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Shield, MonitorSmartphone, AlertTriangle } from 'lucide-react'

export default function Employees() {
  const { data: employees, isLoading } = useQuery({ queryKey: ['employees'], queryFn: api.getEmployees })

  if (isLoading) return <div className="p-8 text-text-disabled text-center animate-pulse" data-testid="employees-loading">Loading Employees...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto" data-testid="employees-page">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Employees</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden" data-testid="employees-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" data-testid="employees-table">
            <thead className="bg-sidebar border-b border-border sticky top-0 z-10">
              <tr>
                <th className="overline-label p-4">Employee</th>
                <th className="overline-label p-4">Role & Dept</th>
                <th className="overline-label p-4">Device</th>
                <th className="overline-label p-4 text-right">Risk Score</th>
                <th className="overline-label p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp: any, index: number) => (
                <tr 
                  key={emp.id} 
                  className={`border-b border-border hover:bg-background/80 transition-colors ${index % 2 === 1 ? 'bg-background/50' : 'bg-surface'}`}
                  data-testid={`employee-row-${emp.id}`}
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
                    <div className="font-medium">{emp.role}</div>
                    <div className="text-sm">{emp.department}</div>
                  </td>
                  <td className="p-4 text-text-primary font-medium">
                    <div className="flex items-center gap-2">
                      <MonitorSmartphone size={16} className="text-text-disabled" />
                      {emp.device_id || 'Unassigned'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center justify-end gap-1 font-bold ${emp.risk_score > 60 ? 'text-primary' : emp.risk_score > 30 ? 'text-[#D15C43]' : 'text-success'}`}>
                      <Shield size={14} />
                      {emp.risk_score}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {emp.risk_score > 60 && (
                        <button className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded font-medium flex items-center gap-1 transition-colors text-sm border border-primary/20" data-testid={`investigate-btn-${emp.id}`}>
                          <AlertTriangle size={14}/> Investigate
                        </button>
                      )}
                      <button className="px-3 py-1.5 bg-surface border border-border hover:border-[#D4D2CC] hover:bg-sidebar rounded font-medium text-text-primary transition-colors text-sm" data-testid={`view-profile-btn-${emp.id}`}>
                        View Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!employees || employees.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-disabled italic border-t border-border">
                    No employees found. Run the setup script to seed the database.
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
