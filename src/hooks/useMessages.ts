import { useState, useCallback, useEffect } from 'react'
import type { Message } from '@/types'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Demo messages — fallback
const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    text: "You always know what to say in awkward situations. It's a real gift.",
    time: new Date(Date.now() - 1000 * 60 * 14),
    read: false,
  },
  {
    id: '2',
    text: "I've always admired how confident you seem even when things are uncertain.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
]

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/messages')
      // Map dates properly
      const data = res.data.data.map((m: any) => ({
        ...m,
        time: new Date(m.createdAt),
      }))
      setMessages(data)
    } catch (err: any) {
      console.error(err)
      // Fallback to demo messages if API fails (e.g. not logged in correctly)
      setMessages(DEMO_MESSAGES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const addMessage = useCallback((text: string) => {
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      time: new Date(),
      read: false,
    }
    setMessages((prev) => [newMsg, ...prev])
  }, [])

  const deleteMessage = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== id))
      await api.delete(`/api/messages/${id}`)
    } catch (err) {
      toast.error('Erreur lors de la suppression')
      fetchMessages() // Revert on failure
    }
  }, [fetchMessages])

  const markAsRead = useCallback(async (id: string) => {
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read: true } : m))
      )
      await api.patch(`/api/messages/${id}/read`)
    } catch (err) {
      fetchMessages() // Revert
    }
  }, [fetchMessages])

  const unreadCount = messages.filter((m) => !m.read).length

  return {
    messages,
    loading,
    error,
    unreadCount,
    addMessage,
    deleteMessage,
    markAsRead,
    setLoading,
    setError,
    refresh: fetchMessages,
  }
}
