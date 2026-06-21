import React, { useEffect } from 'react'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose?: () => void
  durationMs?: number
}

export default function Toast({ message, type = 'info', onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onClose])

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${bg} text-white px-4 py-2 rounded shadow-lg`}> 
      <div style={{ maxWidth: 420 }}>{message}</div>
    </div>
  )
}
