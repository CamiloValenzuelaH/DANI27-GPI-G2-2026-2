import { parseFastApiError } from '../../api/errors'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import type { RegisterRequest } from '../../api/types'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
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
          <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">Comienza tu camino hacia ISO 27001</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre completo</label>
            <input
              type="text"
              placeholder="Juan Pérez"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('full_name', { required: 'El nombre es requerido' })}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="tu@empresa.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('email', { required: 'El email es requerido' })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('password', { required: 'La contraseña es requerida' })}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre de la organización</label>
            <input
              type="text"
              placeholder="Mi Empresa S.A."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('organization_name', { required: 'El nombre de organización es requerido' })}
            />
            {errors.organization_name && (
              <p className="text-xs text-destructive">{errors.organization_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Slug de organización
              <span className="ml-1 text-xs text-muted-foreground">(identificador único)</span>
            </label>
            <input
              type="text"
              placeholder={autoSlug || 'mi-empresa'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('organization_slug', {
                required: 'El slug es requerido',
                pattern: {
                  value: /^[a-z0-9-]+$/,
                  message: 'Solo letras minúsculas, números y guiones',
                },
              })}
            />
            {errors.organization_slug && (
              <p className="text-xs text-destructive">{errors.organization_slug.message}</p>
            )}
            {autoSlug && (
              <p className="text-xs text-muted-foreground">Sugerido: {autoSlug}</p>
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
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}