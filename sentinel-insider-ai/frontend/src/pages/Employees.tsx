import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Shield, MonitorSmartphone, Activity, AlertTriangle } from 'lucide-react'

export default function Employees() {
  const { data: employees, isLoading } = useQuery({ queryKey: ['employees'], queryFn: api.getEmployees })

  if (isLoading) return <div className="p-8 text-slate-400 text-center animate-pulse">Loading Employees...</div>

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Employees</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {employees?.map((emp: any) => (
          <div key={emp.id} className="bg-dark border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-slate-700 transition-colors">
            
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-300">
              {emp.full_name.charAt(0)}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white">{emp.full_name}</h3>
              <p className="text-slate-400">{emp.email} • {emp.department} • {emp.role}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-sm flex items-center gap-2"><Shield size={16}/> Risk Score</span>
                <span className={`text-2xl font-bold ${emp.risk_score > 60 ? 'text-accent' : emp.risk_score > 30 ? 'text-orange-500' : 'text-green-500'}`}>
                  {emp.risk_score}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-sm flex items-center gap-2"><MonitorSmartphone size={16}/> Device</span>
                <span className="text-lg font-medium text-slate-300">{emp.device_id || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors">
                View Profile
              </button>
              {emp.risk_score > 60 && (
                <button className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                  <AlertTriangle size={16}/> Investigate
                </button>
              )}
            </div>
            
          </div>
        ))}
        {(!employees || employees.length === 0) && (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-dark/50">
            No employees found. Run the setup script to seed the database.
          </div>
        )}
      </div>
    </div>
  )
}
