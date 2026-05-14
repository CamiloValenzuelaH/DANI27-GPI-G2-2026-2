import { parseFastApiError } from '../../api/errors'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import type { LoginRequest } from '../../api/types'
import { useIntl } from 'react-intl'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const intl = useIntl()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setError(null)
    setIsLoading(true)
    try {
      await login(data)
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
          <h1 className="text-2xl font-semibold tracking-tight">{intl.formatMessage({ id: 'login.welcome', defaultMessage: 'Welcome to Dani27001' })}</h1>
          <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'login.subtitle', defaultMessage: 'Sign in to your account' })}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1">
            <label className="text-sm font-medium">{intl.formatMessage({ id: 'login.email', defaultMessage: 'Email' })}</label>
            <input
              type="email"
              placeholder={intl.formatMessage({ id: 'login.emailPlaceholder', defaultMessage: 'you@company.com' })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('email', { required: intl.formatMessage({ id: 'login.emailRequired', defaultMessage: 'Email is required' }) })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{intl.formatMessage({ id: 'login.password', defaultMessage: 'Password' })}</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('password', { required: intl.formatMessage({ id: 'login.passwordRequired', defaultMessage: 'Password is required' }) })}
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
            {isLoading ? intl.formatMessage({ id: 'login.loading', defaultMessage: 'Signing in...' }) : intl.formatMessage({ id: 'login.submit', defaultMessage: 'Sign in' })}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'login.noAccount', defaultMessage: "Don't have an account?" })}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {intl.formatMessage({ id: 'login.registerLink', defaultMessage: 'Register' })}
          </Link>
        </p>
      </div>
    </div>
  )
}