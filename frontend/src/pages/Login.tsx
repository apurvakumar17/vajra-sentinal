import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('admin@sentinel.ai')
  const [password, setPassword] = useState('Admin@123')
  const setToken = useAuthStore(state => state.setToken)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await apiClient.post('/auth/login', {
        username: email,
        password: password
      })
      setToken(res.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-darker">
      <div className="bg-dark p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Shield size={48} className="text-primary mb-4" />
          <h2 className="text-2xl font-bold">Sentinel Insider AI</h2>
          <p className="text-slate-400">SOC Analyst Login</p>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-500/20">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="Email address"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="Password"
            required
          />
          <button type="submit" className="bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors mt-2">
            Secure Login
          </button>
        </form>
      </div>
    </div>
  )
}
