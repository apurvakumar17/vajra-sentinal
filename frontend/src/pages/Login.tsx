import { useState } from 'react'
import { Shield, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('admin@sentinel.ai')
  const [password, setPassword] = useState('Admin@123')
  const setToken = useAuthStore(state => state.setToken)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiClient.post('/auth/login', {
        username: email,
        password: password
      })
      setToken(res.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-to-br from-background to-[#EAE8E2] animate-in fade-in duration-700">
      <div className="bg-surface p-10 rounded-[20px] border border-border shadow-md w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-primary/10 p-4 rounded-2xl mb-4 shadow-sm border border-primary/20">
            <Shield size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Sentinel Insider AI</h2>
          <p className="text-sm font-medium text-text-secondary mt-1 tracking-wide">
            AI-Powered Insider Threat Detection Platform
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
            <ShieldCheck size={14} />
            Secure Enterprise Login
          </div>
        </div>
        
        {error && <div className="bg-[#D15C43]/10 text-[#D15C43] p-3 rounded-lg mb-6 text-sm text-center border border-[#D15C43]/20 font-medium">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-text-disabled group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
              placeholder="Email address"
              required
              disabled={loading}
            />
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-text-disabled group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
              placeholder="Password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
