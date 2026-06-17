import { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { X, ArrowLeft, ArrowRight, ChevronRight, Bot } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface OnboardingTourProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function OnboardingTour({ open, setOpen }: OnboardingTourProps) {
  const intl = useIntl()
  const location = useLocation()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [readyToStart, setReadyToStart] = useState(false)

  const steps = useMemo(
    () => [
      {
        path: '/dashboard',
        title: intl.formatMessage({ id: 'tutorial.step1.title', defaultMessage: 'Panel de Control' }),
        description: intl.formatMessage({
          id: 'tutorial.step1.description',
          defaultMessage: 'Revisa el estado general de cumplimiento, alertas y progresos clave desde tu panel principal.',
        }),
      },
      {
        path: '/assets',
        title: intl.formatMessage({ id: 'tutorial.step2.title', defaultMessage: 'Inventario de Activos' }),
        description: intl.formatMessage({
          id: 'tutorial.step2.description',
          defaultMessage: 'Gestiona tus activos, asigna responsables y enlaza evidencias críticas para el cumplimiento.',
        }),
      },
      {
        path: '/documents',
        title: intl.formatMessage({ id: 'tutorial.step3.title', defaultMessage: 'Controles de Documentos' }),
        description: intl.formatMessage({
          id: 'tutorial.step3.description',
          defaultMessage: 'Visualiza tus controles documentales, genera políticas y revisa el estado de cada documento.',
        }),
      },
      {
        path: '/risks',
        title: intl.formatMessage({ id: 'tutorial.step4.title', defaultMessage: 'Gestión de Riesgos' }),
        description: intl.formatMessage({
          id: 'tutorial.step4.description',
          defaultMessage: 'Analiza los riesgos identificados, revisa su criticidad y controla los planes de tratamiento.',
        }),
      },
      {
        path: '/audit',
        title: intl.formatMessage({ id: 'tutorial.step5.title', defaultMessage: 'Preparar Auditoría' }),
        description: intl.formatMessage({
          id: 'tutorial.step5.description',
          defaultMessage: 'Valida tu evidencia, consulta hallazgos y avanza en la preparación para la auditoría con claridad.',
        }),
      },
      {
        path: '/assessment',
        title: intl.formatMessage({ id: 'tutorial.step6.title', defaultMessage: 'Autoevaluación' }),
        description: intl.formatMessage({
          id: 'tutorial.step6.description',
          defaultMessage: 'Completa tu autoevaluación para medir tu nivel de cumplimiento y ver recomendaciones inmediatas.',
        }),
      },
      {
        path: '/settings',
        title: intl.formatMessage({ id: 'tutorial.step7.title', defaultMessage: 'Configuración' }),
        description: intl.formatMessage({
          id: 'tutorial.step7.description',
          defaultMessage: 'Ajusta tus preferencias, idioma y notificaciones para que el programa se adapte a tu equipo.',
        }),
      },
    ],
    [intl]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    if (!readyToStart) {
      return
    }

    const step = steps[currentStep]
    if (step && location.pathname !== step.path) {
      try {
        navigate(step.path)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Onboarding navigation failed', err)
      }
    }
  }, [currentStep, open, readyToStart, location.pathname, navigate, steps])

  useEffect(() => {
    if (!open || readyToStart) {
      return
    }

    const stepIndex = steps.findIndex((step) => step.path === location.pathname)
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0)
  }, [open, readyToStart, location.pathname, steps])

  const step = steps[currentStep]
  const isKnownRoute = steps.some((item) => item.path === location.pathname)

  const goPrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 0))
  const goNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))

  const handleStart = () => {
    setReadyToStart(true)
    setCurrentStep(0)
    // Navega al inicio con un pequeño delay para evitar conflictos durante el render
    setTimeout(() => {
      try {
        if (location.pathname !== steps[0].path) {
          navigate(steps[0].path)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Onboarding navigation failed', err)
      }
    }, 60)
  }

  const handleClose = () => {
    setReadyToStart(false)
    setCurrentStep(0)
    setOpen(false)
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed right-6 top-24 z-50 w-[min(380px,calc(100%-1rem))] rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="absolute -top-2 right-12 h-4 w-4 rotate-45 rounded-sm bg-white/95 shadow-sm dark:bg-slate-950/90" />
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white shadow-lg">
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Bot className="h-3.5 w-3.5" />
                Dani27
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {intl.formatMessage({ id: 'tutorial.title', defaultMessage: 'Hola, soy Dani27' })}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {intl.formatMessage({ id: 'tutorial.subtitle', defaultMessage: 'Tu asistente virtual te guía por la plataforma paso a paso.' })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label={intl.formatMessage({ id: 'tutorial.close', defaultMessage: 'Cerrar guía' })}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {!readyToStart ? (
        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {isKnownRoute
              ? intl.formatMessage({ id: 'tutorial.startPromptKnown', defaultMessage: 'Presiona iniciar para comenzar el tutorial desde el panel principal.' })
              : intl.formatMessage({ id: 'tutorial.startPromptUnknown', defaultMessage: 'Estás en otra sección. Inicia el recorrido para regresar al inicio y seguir el flujo correcto.' })}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
              {intl.formatMessage({ id: 'tutorial.startButton', defaultMessage: 'Iniciar tutorial' })}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {intl.formatMessage({ id: 'tutorial.dismissButton', defaultMessage: 'Cerrar' })}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {intl.formatMessage({ id: 'tutorial.progressLabel', defaultMessage: 'Paso' })} {currentStep + 1} / {steps.length}
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {intl.formatMessage({ id: 'tutorial.stepHint', defaultMessage: 'Mini explicación de la sección actual' })}
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{step.description}</p>
          <div className="mt-4 rounded-2xl bg-white p-3 text-sm text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Dani27 está hablando</p>
                <p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">
                  {intl.formatMessage({ id: 'tutorial.routeHint', defaultMessage: 'El tutorial va marcando cada ruta, sigue las flechas para avanzar.' })}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {intl.formatMessage({ id: 'tutorial.previous', defaultMessage: 'Anterior' })}
            </button>
            <button
              type="button"
              onClick={currentStep === steps.length - 1 ? handleClose : goNext}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {currentStep === steps.length - 1
                ? intl.formatMessage({ id: 'tutorial.finish', defaultMessage: 'Finalizar' })
                : intl.formatMessage({ id: 'tutorial.next', defaultMessage: 'Siguiente' })}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
