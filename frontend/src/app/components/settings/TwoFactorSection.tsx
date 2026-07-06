import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useIntl } from 'react-intl'
import { useAuth } from '../../contexts/AuthContext'
import { twoFactorApi } from '../../../api/twoFactor'
import { parseFastApiError } from '../../../api/errors'

type DisableForm = { password: string }

export default function TwoFactorSection() {
  const intl = useIntl()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const disableSchema = z.object({
    password: z.string().min(8, intl.formatMessage({ id: 'settings.2fa.passwordValidation', defaultMessage: 'Enter your password to disable 2FA' })),
  })

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
      setSuccess(intl.formatMessage({ id: 'settings.2fa.disabledSuccess', defaultMessage: 'Two-factor authentication has been disabled and all backup codes were revoked.' }))
    } catch (err: any) {
      setError(parseFastApiError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2A2E3D] dark:bg-[#0F1720]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{intl.formatMessage({ id: 'settings.2fa.title', defaultMessage: 'Two-factor authentication' })}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-300">
              {enabled
                ? intl.formatMessage({ id: 'settings.2fa.enabledHelp', defaultMessage: 'Your account is protected with TOTP plus backup codes.' })
                : intl.formatMessage({ id: 'settings.2fa.disabledHelp', defaultMessage: 'Protect your account with Google Authenticator, Authy, or 1Password.' })}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 dark:bg-[#2A2E3D] dark:text-white'}`}>
            {enabled
              ? intl.formatMessage({ id: 'settings.2fa.enabled', defaultMessage: 'Enabled' })
              : intl.formatMessage({ id: 'settings.2fa.disabled', defaultMessage: 'Disabled' })}
          </span>
        </div>
      </div>

      {!enabled ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 dark:border-[#2A2E3D] dark:bg-[#0B1116]">
          <p className="text-sm text-slate-600 dark:text-gray-300">
            {intl.formatMessage({ id: 'settings.2fa.setupHelp', defaultMessage: 'Set up 2FA to generate a scannable QR code and receive one-time backup codes.' })}
          </p>
          <button
            type="button"
            onClick={() => navigate('/setup-mfa')}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {intl.formatMessage({ id: 'settings.2fa.enableAction', defaultMessage: 'Enable 2FA' })}
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#2A2E3D] dark:bg-[#0B1116]">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-950 dark:text-white">{intl.formatMessage({ id: 'settings.2fa.disableTitle', defaultMessage: 'Disable 2FA' })}</p>
              <p className="text-sm text-slate-500 dark:text-gray-300">
                {intl.formatMessage({ id: 'settings.2fa.disableHelp', defaultMessage: 'Enter your password to disable 2FA. This revokes the current secret and every backup code.' })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/setup-mfa')}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-[#2A2E3D] dark:text-white"
            >
              {intl.formatMessage({ id: 'settings.2fa.backupCodes', defaultMessage: 'Backup codes' })}
            </button>
          </div>

          <form onSubmit={handleSubmit(onDisable)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-1">
              <input
                type="password"
                autoComplete="current-password"
                placeholder={intl.formatMessage({ id: 'settings.2fa.confirmPassword', defaultMessage: 'Confirm your password' })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 dark:border-[#2A2E3D] dark:bg-[#071016] dark:text-gray-100"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? intl.formatMessage({ id: 'settings.2fa.disabling', defaultMessage: 'Disabling...' })
                : intl.formatMessage({ id: 'settings.2fa.disableAction', defaultMessage: 'Disable 2FA' })}
            </button>
          </form>

          {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">{success}</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-200">{error}</div>}
        </div>
      )}
    </div>
  )
}
