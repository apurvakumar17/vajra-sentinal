import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { ShieldCheck, Plus, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Policies() {
  const queryClient = useQueryClient()
  const { data: policies, isLoading } = useQuery({ queryKey: ['policies'], queryFn: api.getPolicies })
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    status: 'enabled',
    severity: 'medium',
    rules: {}
  })

  const resetForm = () => {
    setFormData({ name: '', description: '', type: 'custom', status: 'enabled', severity: 'medium', rules: {} })
    setEditingPolicy(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (policy: any) => {
    setFormData({
      name: policy.name || '',
      description: policy.description || '',
      type: policy.type || 'custom',
      status: policy.status || 'enabled',
      severity: policy.severity || 'medium',
      rules: policy.rules || {}
    })
    setEditingPolicy(policy)
    setIsModalOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy Created', { description: 'New policy saved successfully.' })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error('Creation Failed', { description: err.message })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.updatePolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy Updated', { description: 'Policy modified successfully.' })
      setIsModalOpen(false)
    },
    onError: (err: any) => toast.error('Update Failed', { description: err.message })
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy Deleted', { description: 'Policy removed successfully.' })
    },
    onError: (err: any) => toast.error('Deletion Failed', { description: err.message })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Validation Error', { description: 'Policy name is required.' })
    
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const toggleStatus = (policy: any) => {
    const newStatus = policy.status === 'enabled' ? 'disabled' : 'enabled'
    updateMutation.mutate({ id: policy.id, data: { status: newStatus } })
  }

  if (isLoading) return <div className="p-8 text-text-disabled">Loading policies...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Policies</h1>
          <p className="text-text-secondary mt-1">Manage security policies and behavioral thresholds.</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm">
          <Plus size={16} /> Create Policy
        </button>
      </div>
      
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Policy Name</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Description</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Status</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4">Last Updated</th>
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-text-disabled">No policies configured.</td></tr>
              ) : (
                policies?.map((policy: any) => (
                  <tr key={policy.id} className="border-b border-border hover:bg-background transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-3">
                      <ShieldCheck size={18} className="text-primary" /> {policy.name}
                    </td>
                    <td className="p-4 text-sm text-text-secondary">{policy.description}</td>
                    <td className="p-4 cursor-pointer" onClick={() => toggleStatus(policy)}>
                      {policy.status === 'enabled' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success-background px-2 py-1 rounded border border-success/20 hover:opacity-80 transition-opacity">
                          <CheckCircle2 size={12} /> Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-text-disabled bg-background px-2 py-1 rounded border border-border hover:opacity-80 transition-opacity">
                          <XCircle size={12} /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {new Date(policy.updated_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                       <button onClick={() => handleOpenEdit(policy)} className="p-1.5 text-text-secondary hover:text-primary transition-colors rounded hover:bg-background"><Pencil size={16}/></button>
                       <button onClick={() => deleteMutation.mutate(policy.id)} className="p-1.5 text-text-secondary hover:text-[#D15C43] transition-colors rounded hover:bg-background"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">{editingPolicy ? 'Edit Policy' : 'Create Policy'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Policy Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Block USB Storage"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors min-h-[80px]"
                  placeholder="Policy description..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="custom">Custom</option>
                    <option value="device_control">Device Control</option>
                    <option value="app_control">Application Control</option>
                    <option value="network">Network</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Severity</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                 <label className="block text-sm font-bold text-text-primary mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-bold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                >
                  {editingPolicy ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
