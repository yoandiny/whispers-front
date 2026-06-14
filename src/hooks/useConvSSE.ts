import { useEffect, useRef } from 'react'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function useConvSSE(endpoint: string | null, onMessage: (msg: any) => void) {
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!endpoint) return

    const url = `${baseURL}${endpoint}`
    const source = new EventSource(url)
    sourceRef.current = source

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'connected') return // internal heartbeat/connection msg
        onMessage(data)
      } catch (err) {
        console.error('SSE Parse error', err)
      }
    }

    source.onerror = (err) => {
      console.error('SSE Error', err)
      // EventSource auto-reconnects, but we can close it if we want custom logic
    }

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [endpoint, onMessage])
}
