import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../contexts/AuthContext'
import { twoFactorApi } from '../../../api/twoFactor'
import { parseFastApiError } from '../../../api/errors'

const disableSchema = z.object({
  password: z.string().min(8, 'Enter your password to disable 2FA'),
})

type DisableForm = z.infer<typeof disableSchema>

export default function TwoFactorSection() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DisableForm>({
    resolver: zodResolver(disableSchema),
    mode: 'onChange',
  })

  const enabled = !!user?.two_factor_enabled

  const onDisable = async (values: DisableForm) => {
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      await twoFactorApi.disable(values)
      await refreshUser()
      reset()
      setSuccess('Two-factor authentication has been disabled and all backup codes were revoked.')
    } catch (err: any) {
      setError(parseFastApiError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Two-factor authentication</p>
            <p className="mt-1 text-xs text-slate-500">
              {enabled
                ? 'Your account is protected with TOTP plus backup codes.'
                : 'Protect your account with Google Authenticator, Authy, or 1Password.'}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {!enabled ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-600">
            Set up 2FA to generate a scannable QR code and receive one-time backup codes.
          </p>
          <button
            type="button"
            onClick={() => navigate('/setup-mfa')}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Enable 2FA
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-950">Disable 2FA</p>
              <p className="text-sm text-slate-500">
                Enter your password to disable 2FA. This revokes the current secret and every backup code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/setup-mfa')}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              Backup codes
            </button>
          </div>

          <form onSubmit={handleSubmit(onDisable)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-1">
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Confirm your password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </form>

          {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>
      )}
    </div>
  )
}
