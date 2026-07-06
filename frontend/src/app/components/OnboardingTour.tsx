import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useIntl } from 'react-intl'
import { X, ArrowLeft, ArrowRight, ChevronRight, Bot } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getLocalizedTutorials, type TutorialStep } from '../data/tutorialContent'

interface OnboardingTourProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function OnboardingTour({ open, setOpen }: OnboardingTourProps) {
  const intl = useIntl()
  const location = useLocation()
  const navigate = useNavigate()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [readyToStart, setReadyToStart] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const tutorials = useMemo(() => getLocalizedTutorials(intl), [intl, intl.locale])

  // Map tutorial steps by path for quick lookup
  const stepsByPath = useMemo(() => {
    const map: Record<string, number> = {}
    tutorials.forEach((step, idx) => {
      map[step.path] = idx
    })
    return map
  }, [tutorials])

  // Get current tutorial step
  const currentStep: TutorialStep | undefined = tutorials[currentStepIndex]
  const currentSection = currentStep?.sections[currentSectionIndex]
  const totalSteps = tutorials.length
  const totalSectionsInStep = currentStep?.sections.length ?? 0
  const isLastSection =
    currentSectionIndex === totalSectionsInStep - 1 && currentStepIndex === totalSteps - 1

  // Apply highlights to DOM elements
  const applyHighlights = useCallback((selectors: string[] | undefined) => {
    if (!selectors) return

    // Remove all previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach((el) => {
      el.classList.remove('tutorial-highlight')
    })

    // Add new highlights
    selectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el) => {
          el.classList.add('tutorial-highlight')
        })

        // Scroll first element into view
        if (elements.length > 0) {
          elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } catch (e) {
        // Invalid selector, skip
      }
    })
  }, [])

  // Navigate to next section/step
  const handleNextClick = useCallback(() => {
    if (!currentStep) return

    if (currentSectionIndex < currentStep.sections.length - 1) {
      // Go to next section in current step
      setCurrentSectionIndex((prev) => prev + 1)
    } else if (currentStepIndex < tutorials.length - 1) {
      // Go to next step
      const nextStep = tutorials[currentStepIndex + 1]
      setCurrentStepIndex((prev) => prev + 1)
      setCurrentSectionIndex(0)

      // Navigate to next step path
      if (nextStep.path && location.pathname !== nextStep.path) {
        navigate(nextStep.path)
      }
    } else {
      // Tutorial complete
      handleClose()
    }
  }, [currentStep, currentStepIndex, currentSectionIndex, location.pathname, navigate, tutorials])

  // Navigate to previous section/step
  const handlePreviousClick = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
    } else if (currentStepIndex > 0) {
      // Go to previous step
      const prevStep = tutorials[currentStepIndex - 1]
      setCurrentStepIndex((prev) => prev - 1)
      setCurrentSectionIndex(prevStep.sections.length - 1)

      if (prevStep.path && location.pathname !== prevStep.path) {
        navigate(prevStep.path)
      }
    }
  }, [currentSectionIndex, currentStepIndex, location.pathname, navigate, tutorials])

  // Start tutorial
  const handleStart = useCallback(() => {
    setReadyToStart(true)
    setCurrentStepIndex(0)
    setCurrentSectionIndex(0)

    setTimeout(() => {
      const firstStep = tutorials[0]
      if (firstStep?.path && location.pathname !== firstStep.path) {
        navigate(firstStep.path)
      }
    }, 100)
  }, [location.pathname, navigate, tutorials])

  // Close tutorial
  const handleClose = useCallback(() => {
    setReadyToStart(false)
    setCurrentStepIndex(0)
    setCurrentSectionIndex(0)
    document.querySelectorAll('.tutorial-highlight').forEach((el) => {
      el.classList.remove('tutorial-highlight')
    })
    setOpen(false)
  }, [setOpen])

  // Navigate to step when it changes
  useEffect(() => {
    if (!open || !readyToStart || !currentStep) return

    if (currentStep.path && location.pathname !== currentStep.path) {
      navigate(currentStep.path)
    }
  }, [currentStepIndex, readyToStart, open, currentStep, location.pathname, navigate])

  // Apply highlights when section changes
  useEffect(() => {
    if (!readyToStart || !currentSection) return

    setTimeout(() => {
      applyHighlights(currentSection.highlights)
    }, 300)
  }, [currentSectionIndex, currentStepIndex, readyToStart, currentSection, applyHighlights])

  useEffect(() => {
    if (!readyToStart) return

    const timer = window.setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [currentStepIndex, currentSectionIndex, readyToStart, intl.locale])

  // Determine current route when tour opens
  useEffect(() => {
    if (!open || readyToStart) return

    const currentPathIndex = stepsByPath[location.pathname]
    if (currentPathIndex !== undefined) {
      setCurrentStepIndex(currentPathIndex)
    } else {
      setCurrentStepIndex(0)
    }
  }, [open, readyToStart, location.pathname, stepsByPath])

  // Check if current route is a known tutorial route
  const isKnownRoute = stepsByPath[location.pathname] !== undefined

  if (!open) {
    return null
  }

  return (
    <div className="fixed right-6 top-20 z-50 w-[min(420px,calc(100%-1rem))] rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-950/90 max-h-[calc(100vh-80px)] flex flex-col">
      <div className="absolute -top-2 right-12 h-4 w-4 rotate-45 rounded-sm bg-white/95 shadow-sm dark:bg-slate-950/90" />
      <div className="flex items-start gap-3 flex-shrink-0">
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
                {intl.formatMessage({
                  id: 'tutorial.subtitle',
                  defaultMessage: 'Tu asistente virtual te guía por la plataforma paso a paso.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label={intl.formatMessage({ id: 'tutorial.close', defaultMessage: 'Cerrar guía' })}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white flex-shrink-0"
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
              ? intl.formatMessage({
                  id: 'tutorial.startPromptKnown',
                  defaultMessage: 'Presiona iniciar para comenzar el tutorial desde el panel principal.',
                })
              : intl.formatMessage({
                  id: 'tutorial.startPromptUnknown',
                  defaultMessage: 'Estás en otra sección. Inicia el recorrido para regresar al inicio y seguir el flujo correcto.',
                })}
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
      ) : currentStep && currentSection ? (
        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {intl.formatMessage({ id: 'tutorial.progressLabel', defaultMessage: 'Paso' })} {currentStepIndex + 1} / {totalSteps} —{' '}
                {currentSectionIndex + 1} / {totalSectionsInStep}
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {currentStep.icon} {currentStep.title}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentSection.title}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div ref={contentRef} className="flex-1 overflow-y-auto mb-3 pr-2">
            {/* Content Section */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950 mb-3">
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {currentSection.content}
              </p>
            </div>

            {/* Action Hint */}
            {currentSection.action && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-slate-700 dark:text-slate-300">
                💡 <span className="font-semibold">Acción:</span> {currentSection.action}
              </div>
            )}
          </div>

          {/* Navigation Buttons - Always Visible */}
          <div className="flex items-center justify-between gap-2 flex-shrink-0 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePreviousClick}
              disabled={currentStepIndex === 0 && currentSectionIndex === 0}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {intl.formatMessage({ id: 'tutorial.previous', defaultMessage: 'Anterior' })}
            </button>
            <button
              type="button"
              onClick={handleNextClick}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {isLastSection
                ? intl.formatMessage({ id: 'tutorial.finish', defaultMessage: 'Finalizar' })
                : intl.formatMessage({ id: 'tutorial.next', defaultMessage: 'Siguiente' })}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
