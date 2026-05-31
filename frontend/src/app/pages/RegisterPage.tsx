import { parseFastApiError } from '../../api/errors'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import type { RegisterRequest } from '../../api/types'
import { useIntl } from 'react-intl'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const intl = useIntl()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterRequest>()

  const onSubmit = async (data: RegisterRequest) => {
    setError(null)
    setIsLoading(true)
    try {
      await registerUser(data)
      navigate('/dashboard')
    } catch (err: any) {
      setError(parseFastApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Genera el slug automáticamente desde el nombre de organización
  const orgName = watch('organization_name') ?? ''
  const autoSlug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{intl.formatMessage({ id: 'register.title', defaultMessage: 'Create account' })}</h1>
          <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'register.subtitle', defaultMessage: 'Start your ISO 27001 journey' })}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1">
            <label className="text-sm font-medium">{intl.formatMessage({ id: 'register.fullName', defaultMessage: 'Full name' })}</label>
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'register.fullNamePlaceholder', defaultMessage: 'Jane Doe' })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('full_name', { required: intl.formatMessage({ id: 'register.fullNameRequired', defaultMessage: 'Name is required' }) })}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{intl.formatMessage({ id: 'register.email', defaultMessage: 'Email' })}</label>
            <input
              type="email"
              placeholder={intl.formatMessage({ id: 'register.emailPlaceholder', defaultMessage: 'you@company.com' })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('email', { required: intl.formatMessage({ id: 'register.emailRequired', defaultMessage: 'Email is required' }) })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{intl.formatMessage({ id: 'register.password', defaultMessage: 'Password' })}</label>
            <input
              type="password"
              placeholder={intl.formatMessage({ id: 'register.passwordPlaceholder', defaultMessage: 'At least 8 characters, 1 uppercase and 1 number' })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('password', { required: intl.formatMessage({ id: 'register.passwordRequired', defaultMessage: 'Password is required' }) })}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{intl.formatMessage({ id: 'register.organizationName', defaultMessage: 'Organization name' })}</label>
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'register.organizationPlaceholder', defaultMessage: 'My Company Inc.' })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('organization_name', { required: intl.formatMessage({ id: 'register.organizationRequired', defaultMessage: 'Organization name is required' }) })}
            />
            {errors.organization_name && (
              <p className="text-xs text-destructive">{errors.organization_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'register.organizationSlug', defaultMessage: 'Organization slug' })}
              <span className="ml-1 text-xs text-muted-foreground">({intl.formatMessage({ id: 'register.uniqueIdentifier', defaultMessage: 'unique identifier' })})</span>
            </label>
            <input
              type="text"
              placeholder={autoSlug || intl.formatMessage({ id: 'register.slugPlaceholder', defaultMessage: 'my-company' })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('organization_slug', {
                required: intl.formatMessage({ id: 'register.slugRequired', defaultMessage: 'Slug is required' }),
                pattern: {
                  value: /^[a-z0-9-]+$/,
                  message: intl.formatMessage({ id: 'register.slugPattern', defaultMessage: 'Only lowercase letters, numbers, and hyphens' }),
                },
              })}
            />
            {errors.organization_slug && (
              <p className="text-xs text-destructive">{errors.organization_slug.message}</p>
            )}
            {autoSlug && (
              <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'register.suggested', defaultMessage: 'Suggested' })}: {autoSlug}</p>
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
            {isLoading ? intl.formatMessage({ id: 'register.loading', defaultMessage: 'Creating account...' }) : intl.formatMessage({ id: 'register.submit', defaultMessage: 'Create account' })}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'register.haveAccount', defaultMessage: 'Already have an account?' })}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {intl.formatMessage({ id: 'register.loginLink', defaultMessage: 'Sign in' })}
          </Link>
        </p>
      </div>
    </div>
  )
}