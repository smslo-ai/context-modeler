import { AppProvider, useApp } from '@/context/AppContext'
import { Nav } from '@/components/nav/Nav'
import { Toast } from '@/components/shared/Toast'

function Shell() {
  const { currentView } = useApp()

  return (
    <div className="min-h-screen">
      <Nav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Both views stay mounted; CSS hidden preserves DOM state */}
        <div
          id="panel-dashboard"
          role="tabpanel"
          aria-labelledby="tab-dashboard"
          aria-hidden={currentView !== 'dashboard'}
          className={currentView !== 'dashboard' ? 'hidden' : undefined}
        >
          <DashboardPlaceholder />
        </div>
        <div
          id="panel-input-studio"
          role="tabpanel"
          aria-labelledby="tab-input-studio"
          aria-hidden={currentView !== 'input-studio'}
          className={currentView !== 'input-studio' ? 'hidden' : undefined}
        >
          <InputStudioPlaceholder />
        </div>
      </main>

      <Toast />
    </div>
  )
}

function DashboardPlaceholder() {
  return (
    <div className="modern-box p-8 text-center">
      <h2 className="text-foreground font-[family-name:var(--font-display)] text-2xl font-bold">
        Dashboard
      </h2>
      <p className="text-foreground-muted mt-2">
        Triad explorer, heatmap, charts, and simulation controls go here (Phase 4).
      </p>
    </div>
  )
}

function InputStudioPlaceholder() {
  return (
    <div className="modern-box p-8 text-center">
      <h2 className="text-foreground font-[family-name:var(--font-display)] text-2xl font-bold">
        Input Studio
      </h2>
      <p className="text-foreground-muted mt-2">
        Workflow, system, and persona forms go here (Phase 5).
      </p>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
