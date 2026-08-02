import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { ShieldCheck, Plus, CheckCircle2, XCircle } from 'lucide-react'

export default function Policies() {
  const { data: policies, isLoading } = useQuery({ queryKey: ['policies'], queryFn: api.getPolicies })

  if (isLoading) return <div className="p-8 text-text-disabled">Loading policies...</div>

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Policies</h1>
          <p className="text-text-secondary mt-1">Manage security policies and behavioral thresholds.</p>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm">
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
                <th className="text-xs uppercase tracking-wider font-bold text-text-secondary p-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {policies?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-text-disabled">No policies configured.</td></tr>
              ) : (
                policies?.map((policy: any) => (
                  <tr key={policy.id} className="border-b border-border hover:bg-background transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-3">
                      <ShieldCheck size={18} className="text-primary" /> {policy.name}
                    </td>
                    <td className="p-4 text-sm text-text-secondary">{policy.description}</td>
                    <td className="p-4">
                      {policy.status === 'enabled' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success-background px-2 py-1 rounded border border-success/20">
                          <CheckCircle2 size={12} /> Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-text-disabled bg-background px-2 py-1 rounded border border-border">
                          <XCircle size={12} /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text-secondary text-right">
                      {new Date(policy.updated_at).toLocaleDateString()}
                    </td>
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
