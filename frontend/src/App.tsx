import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import DashboardLayout from './components/DashboardLayout'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Employees = lazy(() => import('./pages/Employees'))
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'))
const Endpoints = lazy(() => import('./pages/Endpoints'))
const Reports = lazy(() => import('./pages/Reports'))
const Policies = lazy(() => import('./pages/Policies'))
const Settings = lazy(() => import('./pages/Settings'))
const Copilot = lazy(() => import('./pages/Copilot'))
const IncidentDetails = lazy(() => import('./pages/IncidentDetails'))

function App() {
  const token = useAuthStore(state => state.token)

  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading...</div>}>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route element={token ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/incidents/:id" element={<IncidentDetails />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/:id" element={<EmployeeProfile />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/copilot" element={<Copilot />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
