import axios from 'axios'

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

export const api = {
  getMe: () => apiClient.get('/auth/me').then(res => res.data),
  getEmployees: () => apiClient.get('/employees').then(res => res.data),
  getEmployee: (id: string) => apiClient.get(`/employees/${id}`).then(res => res.data),
  createEmployee: (data: any) => apiClient.post('/employees', data).then(res => res.data),
  getAlerts: () => apiClient.get('/alerts').then(res => res.data),
  updateAlertStatus: (id: string, status: string) => apiClient.put(`/alerts/${id}/status`, { status }).then(res => res.data),
  getAgents: () => apiClient.get('/agents').then(res => res.data),
  sendCommand: (agentId: string, command: any) => apiClient.post(`/agents/${agentId}/command`, command).then(res => res.data)
}
