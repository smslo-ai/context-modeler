import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const STORAGE_KEY = 'context-modeler:onboarding-dismissed'

interface Step {
  targetId: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    targetId: 'simulation-control',
    title: 'Simulation Modes',
    description: 'Choose a mode to see how different work patterns reshape the landscape.',
  },
  {
    targetId: 'triad-heading',
    title: 'Context Ontology',
    description: 'Explore workflows, systems, and personas that make up your workplace model.',
  },
  {
    targetId: 'heatmap-heading',
    title: 'Friction Heatmap',
    description: 'Click any cell to see where context-switching friction occurs.',
  },
  {
    targetId: 'tab-input-studio',
    title: 'Input Studio',
    description: 'Switch here to add your own workflows, systems, and personas.',
  },
]

function shouldShowTour(): boolean {
  return !localStorage.getItem(STORAGE_KEY)
}

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(shouldShowTour)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const updatePosition = useCallback(() => {
    const step = STEPS[currentStep]
    if (!step) return

    const target = document.getElementById(step.targetId)
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Position card below target, clamped to viewport
    requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect()
      const cardHeight = cardRef.current?.offsetHeight ?? 200
      const cardWidth = cardRef.current?.offsetWidth ?? 320
      const padding = 12

      let top = rect.bottom + padding
      let left = rect.left

      // Clamp to viewport
      if (top + cardHeight > window.innerHeight - padding) {
        top = rect.top - cardHeight - padding
      }
      if (left + cardWidth > window.innerWidth - padding) {
        left = window.innerWidth - cardWidth - padding
      }
      if (left < padding) {
        left = padding
      }

      setPosition({ top, left })
    })
  }, [currentStep])

  useEffect(() => {
    if (!visible) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [visible, updatePosition])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  function next() {
    if (currentStep >= STEPS.length - 1) {
      dismiss()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  if (!visible) return null

  const step = STEPS[currentStep]
  if (!step) return null

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.2 },
      }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={dismiss} aria-hidden="true" />

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={cardRef}
          role="dialog"
          aria-label={`Onboarding step ${currentStep + 1} of ${STEPS.length}`}
          aria-modal="true"
          className="modern-box fixed z-[61] w-80 max-w-[calc(100vw-24px)] p-4"
          style={{ top: position.top, left: position.left }}
          {...motionProps}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-foreground-muted text-xs font-medium">
              {currentStep + 1} / {STEPS.length}
            </span>
            <button
              onClick={dismiss}
              className="text-foreground-muted hover:text-foreground text-xs transition-colors"
            >
              Skip tour
            </button>
          </div>
          <h4 className="text-foreground font-[family-name:var(--font-display)] text-sm font-semibold">
            {step.title}
          </h4>
          <p className="text-foreground-muted mt-1 text-xs leading-relaxed">{step.description}</p>
          <div className="mt-3 flex justify-end">
            <button
              onClick={next}
              className="bg-primary hover:bg-primary-hover text-background rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {currentStep >= STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
