import React, { useState } from 'react'

export default function ActionButton({
  label,
  onClick,
  variant = 'primary',
}: {
  label: string
  onClick: () => Promise<void> | void
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    try {
      setLoading(true)
      await onClick()
    } finally {
      setLoading(false)
    }
  }
  const base = 'w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out'
  const styles =
    // All variants: white background, subtle border, dark text — no colored fills
    variant === 'primary'
      ? `${base} bg-white text-[#1A1D26] border border-[#CBD5E1] hover:bg-[#F8FAFC] focus:ring-2 focus:ring-[#0B69FF]/10 dark:bg-[#111318] dark:text-white dark:border-[#2A2E3D] dark:hover:bg-[#0F1729]`
      : variant === 'danger'
      ? `${base} bg-white text-[#1A1D26] border border-[#F5C6C6] hover:bg-[#FFF5F5] focus:ring-2 focus:ring-[#B91C1C]/8 dark:bg-[#3B1F22] dark:text-[#FFB4B8] dark:border-[#4A1F22] dark:hover:bg-[#331519]`
      : `${base} bg-white text-[#1A1D26] border border-[#CBD5E1] hover:bg-[#F8FAFC] focus:ring-2 focus:ring-[#0B69FF]/10 dark:bg-[#111318] dark:text-white dark:border-[#2A2E3D] dark:hover:bg-[#0F1729]`

  return (
    <button type="button" className={`${styles} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} onClick={handle} disabled={loading}>
      {loading ? 'Procesando…' : label}
    </button>
  )
}
