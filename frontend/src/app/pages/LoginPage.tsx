import { parseFastApiError } from '../../api/errors'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { useIntl } from 'react-intl'
import type { LoginRequest } from '../../api/types'

const TWO_FACTOR_SESSION_KEY = 'dani_two_factor_challenge'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const intl = useIntl()
  const msg = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await login(data)
      if ('requires_two_factor' in response) {
        sessionStorage.setItem(
          TWO_FACTOR_SESSION_KEY,
          JSON.stringify({
            challengeToken: response.challenge_token,
            email: response.user.email,
            phoneNumber: response.user.phone_number,
          })
        )
        navigate('/two-factor')
        return
      }

      navigate('/dashboard')
    } catch (err: any) {
      setError(parseFastApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{msg('login.welcome', 'Welcome to Dani27001')}</h1>
          <p className="text-sm text-muted-foreground">{msg('login.subtitle', 'Sign in to your account')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1">
            <label className="text-sm font-medium">{msg('login.email', 'Email')}</label>
            <input
              type="email"
              placeholder={msg('login.emailPlaceholder', 'you@company.com')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('email', { required: msg('login.emailRequired', 'Email is required') })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{msg('login.password', 'Password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('password', { required: msg('login.passwordRequired', 'Password is required') })}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? msg('login.signingIn', 'Signing in...') : msg('login.signIn', 'Sign in')}
          </button>
        </form>

          <p className="text-center text-sm text-muted-foreground">
          {msg('login.noAccount', "Don't have an account?")}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {msg('login.register', 'Register')}
          </Link>
        </p>
      </div>
    </div>
  )
}