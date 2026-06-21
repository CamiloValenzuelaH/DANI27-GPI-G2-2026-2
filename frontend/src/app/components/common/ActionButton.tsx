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

  const base = 'px-3 py-1 text-sm rounded-md'
  const styles =
    variant === 'primary'
      ? `${base} bg-[#0B69FF] text-white`
      : variant === 'danger'
      ? `${base} bg-[#E5484D] text-white`
      : `${base} border border-[#CBD5E1] text-[#1A1D26]`

  return (
    <button className={styles} onClick={handle} disabled={loading}>
      {loading ? 'Procesando…' : label}
    </button>
  )
}
