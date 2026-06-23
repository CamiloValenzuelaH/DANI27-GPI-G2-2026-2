import React from 'react'
import { createRoot } from 'react-dom/client'
import ToastComponent from '../components/Toast'

function show(message: string, type: 'success' | 'error' | 'info' = 'info', durationMs = 4000) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  function cleanup() {
    try {
      root.unmount()
    } catch (e) {}
    try {
      document.body.removeChild(container)
    } catch (e) {}
  }

  root.render(<ToastComponent message={message} type={type} onClose={cleanup} durationMs={durationMs} />)
}

export const Toast = {
  success: (msg: string) => show(msg, 'success'),
  error: (msg: string) => show(msg, 'error'),
  info: (msg: string) => show(msg, 'info'),
}

export default Toast
