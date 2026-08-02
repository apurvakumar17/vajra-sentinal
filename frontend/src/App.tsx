import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Employees from './pages/Employees'
import Endpoints from './pages/Endpoints'
import Copilot from './pages/Copilot'

function App() {
  const token = useAuthStore(state => state.token)

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      
      {/* Protected Routes */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/endpoints" element={<Endpoints />} />
        <Route path="/copilot" element={<Copilot />} />
      </Route>
    </Routes>
  )
}

export default App
