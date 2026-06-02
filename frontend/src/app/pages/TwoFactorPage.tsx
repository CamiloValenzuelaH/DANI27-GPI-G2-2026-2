import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import { parseFastApiError } from '../../api/errors'
import { twoFactorApi } from '../../api/twoFactor'

const TWO_FACTOR_SESSION_KEY = 'dani_two_factor_challenge'

const schema = z.object({
  mode: z.enum(['totp', 'backup', 'sms', 'email']),
  code: z.string().trim().optional().default(''),
  backupCode: z.string().trim().optional().default(''),
}).superRefine((data, ctx) => {
  if (data.mode === 'backup') {
    if (!data.backupCode || data.backupCode.replace(/[^a-z0-9]/gi, '').length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid backup code', path: ['backupCode'] })
    }
    return
  }

  if (!data.code || data.code.replace(/\s+/g, '').length !== 6) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the 6-digit code', path: ['code'] })
  }
})

type FormValues = z.infer<typeof schema>

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<string | null>(null)
  const [isSending, setIsSending] = useState<'sms' | 'email' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { mode: 'totp', code: '', backupCode: '' },
  })

  const mode = watch('mode')

  useEffect(() => {
    const raw = sessionStorage.getItem(TWO_FACTOR_SESSION_KEY)
    if (!raw) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const parsed = JSON.parse(raw) as { challengeToken?: string; email?: string }
      setChallengeToken(parsed.challengeToken ?? null)
      setEmail(parsed.email ?? '')
      if (!parsed.challengeToken) {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const title = useMemo(() => {
    if (mode === 'backup') return 'Use a backup code'
    if (mode === 'sms') return 'Enter the SMS code'
    if (mode === 'email') return 'Enter the email code'
    return 'Enter your authenticator code'
  }, [mode])

  const sendDeliveryCode = async (deliveryMethod: 'sms' | 'email') => {
    if (!challengeToken) return
    setError(null)
    setStatus(null)
    setIsSending(deliveryMethod)
    try {
      if (deliveryMethod === 'sms') {
        await twoFactorApi.sendSms({ challenge_token: challengeToken })
      } else {
        await twoFactorApi.sendEmail({ challenge_token: challengeToken })
      }
      setValue('mode', deliveryMethod, { shouldValidate: true })
      setStatus(deliveryMethod === 'sms' ? 'SMS sent. Check your phone.' : 'Email sent. Check your inbox.')
    } catch (err: any) {
      setError(parseFastApiError(err))
    } finally {
      setIsSending(null)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!challengeToken) return
    setError(null)
    setStatus(null)
    setIsSubmitting(true)

    try {
      const result = await twoFactorApi.verify(
        values.mode === 'backup'
          ? { challenge_token: challengeToken, backup_code: values.backupCode }
          : values.mode === 'sms' || values.mode === 'email'
            ? { challenge_token: challengeToken, code: values.code, delivery_method: values.mode }
            : { challenge_token: challengeToken, code: values.code }
      )

      if (!result.tokens || !result.user) {
        throw new Error('Two-factor verification did not return tokens')
      }

      completeLogin({ tokens: result.tokens, user: result.user })
      sessionStorage.removeItem(TWO_FACTOR_SESSION_KEY)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(parseFastApiError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,110,247,0.18),_transparent_42%),linear-gradient(180deg,_#08101d_0%,_#0f172a_48%,_#f8fafc_48%,_#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <div className="grid w-full gap-0 overflow-hidden rounded-3xl border border-white/15 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between bg-slate-950 p-8 text-white lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/70">
                Two-factor authentication
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight">Secure your session</h1>
                <p className="max-w-md text-sm leading-6 text-white/70">
                  {email ? `We need an additional verification step for ${email}.` : 'Enter the code from your authenticator app, backup code, SMS, or email.'}
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Google Authenticator</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Authy</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">1Password</div>
            </div>
          </div>

          <div className="p-8 lg:p-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="text-sm text-slate-500">Choose the method you want to use and complete the verification.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(['totp', 'sms', 'email', 'backup'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('mode', value, { shouldValidate: true })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${mode === value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
                >
                  {value.replace('_', ' ')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {mode === 'backup' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Backup code</label>
                  <input
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="ABCD-EF12"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm tracking-[0.18em] uppercase text-slate-950 outline-none ring-0 transition focus:border-slate-900"
                    {...register('backupCode')}
                  />
                  {errors.backupCode && <p className="text-xs text-red-600">{errors.backupCode.message}</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm tracking-[0.35em] text-slate-950 outline-none ring-0 transition focus:border-slate-900"
                    {...register('code')}
                  />
                  {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify and continue'}
                </button>
                <button
                  type="button"
                  disabled={isSending === 'sms'}
                  onClick={() => sendDeliveryCode('sms')}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending === 'sms' ? 'Sending SMS...' : 'Send SMS'}
                </button>
                <button
                  type="button"
                  disabled={isSending === 'email'}
                  onClick={() => sendDeliveryCode('email')}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending === 'email' ? 'Sending email...' : 'Send email'}
                </button>
              </div>

              {status && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div>}
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            </form>

            <p className="mt-8 text-xs leading-5 text-slate-500">
              If you lost access to your authenticator, use a backup code or request a fallback code by SMS or email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
