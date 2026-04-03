import { useSimulation } from '@/hooks/useSimulation'
import type { SimulationMode } from '@/types'
import { cn } from '@/utils/cn'

const MODES: { mode: SimulationMode; emoji: string; title: string; subtitle: string }[] = [
  {
    mode: 'morning-triage',
    emoji: '\u2615',
    title: 'Morning Triage',
    subtitle: 'Urgent-first prioritization',
  },
  {
    mode: 'deep-focus',
    emoji: '\uD83C\uDFAF',
    title: 'Deep Focus',
    subtitle: 'Low-distraction mode',
  },
  {
    mode: 'firefighting',
    emoji: '\uD83D\uDD25',
    title: 'Firefighting',
    subtitle: 'Crisis response',
  },
]

export function SimulationControl() {
  const { currentMode, setMode } = useSimulation()

  return (
    <div role="radiogroup" aria-label="Simulation mode" className="flex flex-col gap-3">
      <h3 className="text-foreground-muted text-xs font-bold tracking-widest uppercase">
        Simulation Mode
      </h3>
      {MODES.map(({ mode, emoji, title, subtitle }) => (
        <button
          key={mode}
          role="radio"
          aria-checked={currentMode === mode}
          onClick={() => setMode(mode)}
          className={cn(
            'modern-box-sm flex items-center gap-3 p-3 text-left transition-colors',
            currentMode === mode
              ? 'border-primary ring-primary ring-1'
              : 'border-white/8 hover:border-white/16',
          )}
        >
          <span className="text-2xl" aria-hidden="true">
            {emoji}
          </span>
          <div>
            <div className="text-foreground text-sm font-semibold">{title}</div>
            <div className="text-foreground-muted text-xs">{subtitle}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
