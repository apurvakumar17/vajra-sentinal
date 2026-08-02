export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'Alert' | 'Incident' | 'Endpoint' | 'Policy' | 'Employee' | 'System' | string
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | string
  timestamp: string
  read: boolean
  employee_id?: string | null
  related_employee?: string | null
  device_id?: string | null
  related_endpoint?: string | null
  incident_id?: string | null
  related_incident?: string | null
  link?: string | null
}
