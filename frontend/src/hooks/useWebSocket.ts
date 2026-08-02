import { useEffect, useState } from 'react'

export function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null)

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

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(targetUrl)

      ws.onmessage = (event) => {
        try {
          setData(JSON.parse(event.data))
        } catch {
          setData(event.data)
        }
      }
    } catch (err) {
      console.warn('WebSocket connection error:', err)
    }

    return () => {
      ws?.close()
    }
  }, [url])

  return data
}
