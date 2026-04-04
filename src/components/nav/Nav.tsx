import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AboutModal } from '@/components/shared/AboutModal'
import type { ViewKey } from '@/types'

const views: { key: ViewKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'input-studio', label: 'Input Studio' },
]

export function Nav() {
  const { currentView, dispatch } = useApp()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <header className="modern-box sticky top-0 z-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-4 sm:px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-9 w-9 items-center justify-center rounded-full">
            <span className="text-primary font-[family-name:var(--font-display)] text-sm font-bold">
              C
            </span>
          </div>
          <div>
            <p className="text-foreground font-[family-name:var(--font-display)] text-sm font-semibold">
              Context Modeler
            </p>
            <p className="text-foreground-subtle text-[10px]">by Shane Slosar</p>
          </div>
        </div>

        {/* View tabs */}
        <nav className="flex items-center gap-1">
          <div role="tablist" aria-label="Views" className="flex items-center gap-1">
            {views.map((view) => (
              <button
                key={view.key}
                id={`tab-${view.key}`}
                role="tab"
                aria-selected={currentView === view.key}
                aria-controls={`panel-${view.key}`}
                tabIndex={currentView === view.key ? 0 : -1}
                onClick={() => dispatch({ type: 'SET_VIEW', payload: view.key })}
                className={
                  currentView === view.key
                    ? 'bg-primary/15 text-primary rounded-lg px-4 py-2 text-sm font-medium'
                    : 'text-foreground-muted hover:text-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5'
                }
              >
                {view.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAboutOpen(true)}
            className="text-foreground-muted hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5"
          >
            About
          </button>
        </nav>
      </div>

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </header>
  )
}
