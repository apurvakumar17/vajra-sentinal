import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api/v1',
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
  
  getDashboardStats: () => apiClient.get('/dashboard/stats').then(res => res.data),
  
  getEmployees: () => apiClient.get('/employees').then(res => res.data),
  getEmployee: (id: string) => apiClient.get(`/employees/${id}`).then(res => res.data),
  createEmployee: (data: any) => apiClient.post('/employees', data).then(res => res.data),
  
  getAlerts: () => apiClient.get('/alerts').then(res => res.data),
  updateAlertStatus: (id: string, status: string) => apiClient.put(`/alerts/${id}/status`, { status }).then(res => res.data),
  
  getIncidents: () => apiClient.get('/incidents').then(res => res.data),
  updateIncidentStatus: (id: string, status: string) => apiClient.put(`/incidents/${id}/status`, { status }).then(res => res.data),
  
  getEndpoints: () => apiClient.get('/endpoints').then(res => res.data),
  getLiveTelemetry: (deviceId: string) => apiClient.get(`/endpoint/live?device_id=${deviceId}`).then(res => res.data),
  sendCommand: (endpointId: string, command: any) => apiClient.post(`/endpoints/${endpointId}/command`, command).then(res => res.data),
  
  getPolicies: () => apiClient.get('/policies').then(res => res.data),
  getReports: () => apiClient.get('/reports').then(res => res.data),
  
  askCopilot: (prompt: string) => apiClient.post('/copilot', { prompt }).then(res => res.data)
}
