import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, 
  X, 
  CheckCheck, 
  Check, 
  Trash2, 
  Search, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Users, 
  MonitorSmartphone, 
  ShieldCheck, 
  FileText, 
  Terminal, 
  ExternalLink,
  Filter
} from 'lucide-react'
import { api } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import { AppNotification } from '../types'

function formatTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (isNaN(seconds) || seconds < 0) return 'Just now'
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return date.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Critical' | 'Alerts' | 'Endpoints' | 'Employees' | 'Policies'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Real-time WebSockets update listener
  const wsData = useWebSocket('/api/v1/ws/dashboard')

  useEffect(() => {
    if (wsData) {
      if (wsData.type === 'notification' || wsData.type === 'telemetry' || wsData.type === 'alert') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    }
  }, [wsData, queryClient])

  // Fetch notifications
  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 10000 // Polling fallback
  })

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  // Filtered & Searched notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Apply tab filter
      if (activeFilter === 'Unread' && n.read) return false
      if (activeFilter === 'Critical' && n.severity !== 'Critical') return false
      if (activeFilter === 'Alerts' && n.type !== 'Alert') return false
      if (activeFilter === 'Endpoints' && n.type !== 'Endpoint') return false
      if (activeFilter === 'Employees' && n.type !== 'Employee') return false
      if (activeFilter === 'Policies' && n.type !== 'Policy') return false

      // Apply search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = n.title.toLowerCase().includes(q)
        const matchMsg = n.message.toLowerCase().includes(q)
        const matchEmp = n.related_employee?.toLowerCase().includes(q) || n.employee_id?.toLowerCase().includes(q)
        const matchDev = n.related_endpoint?.toLowerCase().includes(q) || n.device_id?.toLowerCase().includes(q)
        const matchInc = n.related_incident?.toLowerCase().includes(q) || n.incident_id?.toLowerCase().includes(q)
        return matchTitle || matchMsg || matchEmp || matchDev || matchInc
      }

      return true
    })
  }, [notifications, activeFilter, searchQuery])

  const handleNavigate = (link?: string | null, type?: string) => {
    setIsOpen(false)
    if (link) {
      navigate(link)
    } else {
      switch (type) {
        case 'Alert':
        case 'Incident':
          navigate('/alerts')
          break
        case 'Employee':
          navigate('/employees')
          break
        case 'Endpoint':
          navigate('/endpoints')
          break
        case 'Policy':
          navigate('/policies')
          break
        default:
          navigate('/alerts')
      }
    }
  }

  const getNotificationIcon = (type: string, severity: string) => {
    if (severity === 'Critical') return <AlertTriangle className="text-red-500 shrink-0" size={18} />
    if (type === 'Alert' || type === 'Incident') return <AlertCircle className="text-orange-500 shrink-0" size={18} />
    if (type === 'Employee') return <Users className="text-purple-500 shrink-0" size={18} />
    if (type === 'Endpoint') return <MonitorSmartphone className="text-blue-500 shrink-0" size={18} />
    if (type === 'Policy') return <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
    if (type === 'System') return <Terminal className="text-slate-400 shrink-0" size={18} />
    return <Info className="text-blue-400 shrink-0" size={18} />
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/15 text-red-500 border border-red-500/20'
      case 'High':
        return 'bg-orange-500/15 text-orange-500 border border-orange-500/20'
      case 'Medium':
        return 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
      default:
        return 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-text-secondary hover:text-primary p-2 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Notifications"
        data-testid="notifications-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-primary text-primary-text font-bold text-xs rounded-full flex items-center justify-center border-2 border-surface shadow-sm animate-pulse"
            data-testid="notifications-badge"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-[420px] max-w-[90vw] bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200"
          data-testid="notification-panel"
        >
          {/* Panel Header */}
          <div className="p-4 border-b border-border bg-sidebar flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <h2 className="font-bold text-text-primary text-base">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs font-semibold text-text-secondary hover:text-primary flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-background transition-colors"
                  title="Mark all as read"
                  data-testid="mark-all-read-btn"
                >
                  <CheckCheck size={15} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-background transition-colors"
                aria-label="Close notifications panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-border bg-background/50 shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input 
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-disabled"
                data-testid="notification-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-border bg-sidebar flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {(['All', 'Unread', 'Critical', 'Alerts', 'Endpoints', 'Employees', 'Policies'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-primary text-primary-text font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
                data-testid={`notification-filter-${filter.toLowerCase()}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-3 text-text-secondary">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border">
                  <Bell size={22} className="text-text-disabled" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">No new notifications</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {searchQuery || activeFilter !== 'All' 
                      ? 'No notifications match your search or filter.' 
                      : 'You are all caught up on system security events.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3.5 transition-all rounded-xl hover:bg-background/80 flex gap-3 group relative ${
                    !notif.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  data-testid={`notification-item-${notif.id}`}
                >
                  {/* Icon */}
                  <div className="mt-0.5">
                    {getNotificationIcon(notif.type, notif.severity)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-xs text-text-primary truncate max-w-[220px]">
                        {notif.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${getSeverityBadgeClass(notif.severity)}`}>
                        {notif.severity}
                      </span>
                      <span className="text-[11px] text-text-disabled ml-auto whitespace-nowrap">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    {/* Related Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {notif.related_employee && (
                        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium">
                          👤 {notif.related_employee}
                        </span>
                      )}
                      {notif.related_endpoint && (
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium">
                          💻 {notif.related_endpoint}
                        </span>
                      )}
                      {notif.related_incident && (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                          ⚠️ {notif.related_incident}
                        </span>
                      )}
                    </div>

                    {/* View Details button */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!notif.read) markReadMutation.mutate(notif.id)
                          handleNavigate(notif.link, notif.type)
                        }}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group/btn"
                        data-testid={`notification-view-details-${notif.id}`}
                      >
                        <span>View Details</span>
                        <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="absolute right-3 top-3.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {!notif.read && (
                      <button
                        onClick={() => markReadMutation.mutate(notif.id)}
                        className="p-1 text-text-secondary hover:text-primary rounded-lg hover:bg-surface border border-transparent hover:border-border transition-colors"
                        title="Mark as read"
                        data-testid={`notification-mark-read-${notif.id}`}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotificationMutation.mutate(notif.id)}
                      className="p-1 text-text-secondary hover:text-red-500 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-colors"
                      title="Clear notification"
                      data-testid={`notification-delete-${notif.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-border bg-sidebar text-xs text-text-disabled flex items-center justify-between shrink-0">
              <span>Showing {filteredNotifications.length} notifications</span>
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/alerts')
                }}
                className="text-primary hover:underline font-medium"
              >
                View all security alerts →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
