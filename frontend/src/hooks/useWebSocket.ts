import { useEffect, useState, useRef } from 'react'

export function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)

  useEffect(() => {
    let targetUrl = url
    if (url.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      targetUrl = `${protocol}//${window.location.host}${url}`
    } else if (url.includes('127.0.0.1:8000') || url.includes('localhost:8000')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const path = url.substring(url.indexOf('/api/'))
      targetUrl = `${protocol}//${window.location.host}${path}`
    }

    let isSubscribed = true

    function connect() {
      if (!isSubscribed) return
      try {
        const ws = new WebSocket(targetUrl)
        wsRef.current = ws

        ws.onopen = () => {
          retryCount.current = 0
        }

        ws.onmessage = (event) => {
          try {
            setData(JSON.parse(event.data))
          } catch {
            setData(event.data)
          }
        }

        ws.onclose = () => {
          if (isSubscribed) {
            const timeout = Math.min(10000, 1000 * Math.pow(2, retryCount.current))
            retryCount.current++
            setTimeout(connect, timeout)
          }
        }
      } catch (err) {
        console.warn('WebSocket connection error:', err)
      }
    }

    connect()

    return () => {
      isSubscribed = false
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url])

  return data
}
