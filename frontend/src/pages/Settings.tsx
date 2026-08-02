import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function Settings() {
  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Platform configuration and preferences.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="text-secondary" size={24} />
          <h2 className="text-xl font-bold text-text-primary">System Preferences</h2>
        </div>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Data Retention Period (Days)</label>
            <input type="number" defaultValue={90} className="w-full max-w-sm bg-background border border-border text-text-primary rounded-lg px-4 py-2 focus:outline-none focus:border-primary shadow-sm" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Default Risk Threshold</label>
            <input type="number" defaultValue={60} className="w-full max-w-sm bg-background border border-border text-text-primary rounded-lg px-4 py-2 focus:outline-none focus:border-primary shadow-sm" />
            <p className="text-xs text-text-disabled mt-2">Scores above this value will trigger High Risk alerts.</p>
          </div>
          
          <div className="pt-4 border-t border-border">
            <button type="button" className="bg-primary hover:bg-primary-hover text-primary-text px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm">
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
