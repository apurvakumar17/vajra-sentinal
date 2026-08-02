import { useEffect, useState } from 'react'

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
