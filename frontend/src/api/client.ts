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
  
  getPolicies: () => apiClient.get('/policies').then(res => res.data),
  createPolicy: (data: any) => apiClient.post('/policies', data).then(res => res.data),
  updatePolicy: (id: string, data: any) => apiClient.put(`/policies/${id}`, data).then(res => res.data),
  deletePolicy: (id: string) => apiClient.delete(`/policies/${id}`).then(res => res.data),
  
  getReports: () => apiClient.get('/reports').then(res => res.data),
  createReport: (data: any) => apiClient.post('/reports', data).then(res => res.data),
  downloadReport: (id: string) => apiClient.get(`/reports/${id}/download`, { responseType: 'blob' }).then(res => res.data),

  getIncidents: () => apiClient.get('/incidents').then(res => res.data),
  updateIncident: (id: string, data: any) => apiClient.put(`/incidents/${id}`, data).then(res => res.data),
  updateIncidentStatus: (id: string, status: string) => apiClient.put(`/incidents/${id}/status`, { status }).then(res => res.data),

  getEndpoints: () => apiClient.get('/endpoints').then(res => res.data),
  getLiveTelemetry: (deviceId: string) => apiClient.get(`/endpoint/live?device_id=${deviceId}`).then(res => res.data),
  sendCommand: (endpointId: string, command: any) => apiClient.post(`/endpoints/${endpointId}/command`, command).then(res => res.data),
  
  getNotifications: (params?: { type?: string; severity?: string; unread_only?: boolean }) => 
    apiClient.get('/notifications', { params }).then(res => res.data),
  markNotificationRead: (id: string) => 
    apiClient.post('/notifications/read', { id }).then(res => res.data),
  markAllNotificationsRead: () => 
    apiClient.post('/notifications/read-all').then(res => res.data),
  deleteNotification: (id: string) => 
    apiClient.delete(`/notifications/${id}`).then(res => res.data),

  // Quick Action Agent Tasks
  lockWorkstation: (data: { employee_id?: string; device_id?: string }) =>
    apiClient.post('/agent/tasks/lock', data).then(res => res.data),
  forceLogout: (data: { employee_id?: string; device_id?: string }) =>
    apiClient.post('/agent/tasks/logout', data).then(res => res.data),
  killProcess: (data: { employee_id?: string; device_id?: string; process_name?: string; pid?: number }) =>
    apiClient.post('/agent/tasks/kill-process', data).then(res => res.data),
  collectForensics: (data: { employee_id?: string; device_id?: string; depth?: string }) =>
    apiClient.post('/agent/tasks/collect-forensics', data).then(res => res.data),
  restartAgent: (data: { employee_id?: string; device_id?: string }) =>
    apiClient.post('/agent/tasks/restart-agent', data).then(res => res.data),
  getTasks: (params?: { employee_id?: string; device_id?: string }) =>
    apiClient.get('/tasks', { params }).then(res => res.data),
  getAuditLogs: (params?: { employee_id?: string }) =>
    apiClient.get('/audit-logs', { params }).then(res => res.data),
  
  askCopilot: (prompt: string) => apiClient.post('/copilot', { prompt }).then(res => res.data)

}
