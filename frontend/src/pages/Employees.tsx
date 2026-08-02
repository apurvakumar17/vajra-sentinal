import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Shield, MonitorSmartphone, AlertTriangle } from 'lucide-react'

export default function Employees() {
  const queryClient = useQueryClient()
  const { data: employees, isLoading } = useQuery({ queryKey: ['employees'], queryFn: api.getEmployees })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', role: '', department: 'General', photo_url: '' })

  const createMutation = useMutation({
    mutationFn: api.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsModalOpen(false)
      setFormData({ full_name: '', role: '', department: 'General', photo_url: '' })
    },
    onError: (error: any) => {
      console.error("Failed to create employee:", error)
      alert(error.response?.data?.detail || "Failed to create employee")
    }
  })

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, photo_url: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  if (isLoading) return <div className="p-8 text-text-disabled text-center animate-pulse" data-testid="employees-loading">Loading Employees...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto" data-testid="employees-page">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Employees</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-lg font-bold shadow-sm transition-colors" data-testid="btn-add-employee">
          Add Employee
        </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-text-primary/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg shadow-md p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Add Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-background border border-border text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-primary shadow-sm" data-testid="input-fullname" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Position / Role</label>
                <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-background border border-border text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-primary shadow-sm" data-testid="input-role" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Department</label>
                <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-background border border-border text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:border-primary shadow-sm" data-testid="input-department" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Profile Picture</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-background border border-border text-text-primary rounded-lg px-3 py-2 focus:outline-none shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-sidebar file:text-text-primary hover:file:bg-border cursor-pointer" data-testid="input-photo" />
                {formData.photo_url && (
                  <div className="mt-3 flex items-center gap-3 text-sm text-success font-medium bg-success-background p-2 rounded-lg border border-success/20">
                    <img src={formData.photo_url} alt="Preview" className="h-8 w-8 rounded-full object-cover border border-success/30 shadow-sm" /> Image ready to upload
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-sidebar border border-border hover:bg-border text-text-primary rounded-lg font-bold shadow-sm transition-colors" data-testid="btn-cancel">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-text rounded-lg font-bold shadow-sm transition-colors disabled:opacity-70" data-testid="btn-save">{createMutation.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
