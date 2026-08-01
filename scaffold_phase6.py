import os
import json

files = {
    "sentinel-insider-ai/frontend/package.json": """{
  "name": "sentinel-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.300.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
""",
    "sentinel-insider-ai/frontend/tsconfig.json": """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
""",
    "sentinel-insider-ai/frontend/tsconfig.node.json": """{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
""",
    "sentinel-insider-ai/frontend/vite.config.ts": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
""",
    "sentinel-insider-ai/frontend/tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f172a',
        darker: '#020617',
        primary: '#3b82f6',
        accent: '#f43f5e',
      }
    },
  },
  plugins: [],
}
""",
    "sentinel-insider-ai/frontend/postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""",
    "sentinel-insider-ai/frontend/index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sentinel Insider AI</title>
  </head>
  <body class="bg-darker text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""",
    "sentinel-insider-ai/frontend/src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #020617; /* Slate 950 */
  color: #f8fafc; /* Slate 50 */
}
""",
    "sentinel-insider-ai/frontend/src/main.tsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
""",
    "sentinel-insider-ai/frontend/src/App.tsx": """import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const token = useAuthStore(state => state.token)

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      
      {/* Protected Routes */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        {/* We will add Alerts and Employees pages in Phase 7 */}
      </Route>
    </Routes>
  )
}

export default App
""",
    "sentinel-insider-ai/frontend/src/store/authStore.ts": """import { create } from 'zustand'

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('sentinel_token'),
  setToken: (token: string) => {
    localStorage.setItem('sentinel_token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('sentinel_token');
    set({ token: null });
  }
}))
""",
    "sentinel-insider-ai/frontend/src/api/client.ts": """import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Auto-inject token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('sentinel_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
""",
    "sentinel-insider-ai/frontend/src/hooks/useWebSocket.ts": """import { useEffect, useState } from 'react'

export function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    
    ws.onmessage = (event) => {
      // In production, parse JSON
      setData(event.data)
    }

    return () => {
      ws.close()
    }
  }, [url])

  return data
}
""",
    "sentinel-insider-ai/frontend/src/components/DashboardLayout.tsx": """import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Shield, Users, AlertTriangle, LogOut } from 'lucide-react'

export default function DashboardLayout() {
  const logout = useAuthStore(state => state.logout)

  return (
    <div className="flex h-screen bg-darker">
      {/* Sidebar */}
      <div className="w-64 bg-dark border-r border-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-10 text-primary">
          <Shield size={32} />
          <h1 className="text-xl font-bold text-white">Sentinel AI</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-4">
          <a href="#" className="flex items-center gap-3 text-slate-300 hover:text-white bg-slate-800/50 p-2 rounded-lg">
            <AlertTriangle size={20} />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-slate-500 hover:text-slate-300 p-2">
            <Users size={20} />
            <span>Employees</span>
          </a>
        </nav>
        
        <button onClick={logout} className="flex items-center gap-3 text-slate-500 hover:text-accent p-2 mt-auto">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  )
}
""",
    "sentinel-insider-ai/frontend/src/pages/Login.tsx": """import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('admin@sentinel.ai')
  const [password, setPassword] = useState('admin')
  const setToken = useAuthStore(state => state.setToken)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)
      
      const res = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      setToken(res.data.access_token)
    } catch (err) {
      setError('Invalid credentials')
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
""",
    "sentinel-insider-ai/frontend/src/pages/Dashboard.tsx": """import { useWebSocket } from '../hooks/useWebSocket'
import { Activity } from 'lucide-react'

export default function Dashboard() {
  const wsData = useWebSocket('ws://127.0.0.1:8000/ws/dashboard')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-xl"><Activity size={24} /></div>
          <div>
            <p className="text-slate-400 text-sm">Active Agents</p>
            <p className="text-2xl font-bold">3</p>
          </div>
        </div>
      </div>

      <div className="bg-dark border border-slate-800 p-6 rounded-2xl h-64 flex flex-col justify-center items-center text-slate-500">
        <p>Real-time updates via WebSocket:</p>
        <p className="font-mono text-primary mt-2">{wsData || 'Waiting for events...'}</p>
        <p className="mt-4 text-sm text-slate-600">(More dashboard features coming in Phase 7)</p>
      </div>
    </div>
  )
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

print("Phase 6 Scaffolding completed.")
