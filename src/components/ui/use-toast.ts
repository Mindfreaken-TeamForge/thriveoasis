import { useState, useCallback } from 'react'

interface ToastOptions {
  title: string
  description?: string
  duration?: number
  variant?: 'default' | 'destructive'
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastOptions[]>([])

  const toast = useCallback((options: ToastOptions) => {
    setToasts((prevToasts) => [...prevToasts, options])
    if (options.duration) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t !== options))
      }, options.duration)
    }
  }, [])

  return { toast, toasts }
}