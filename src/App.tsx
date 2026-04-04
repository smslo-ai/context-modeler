import { AppProvider, useApp } from '@/context/AppContext'
import { Nav } from '@/components/nav/Nav'
import { Toast } from '@/components/shared/Toast'
import { Onboarding } from '@/components/shared/Onboarding'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { InputStudio } from '@/components/input-studio/InputStudio'

function Shell() {
  const { currentView } = useApp()

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="bg-primary text-background sr-only rounded px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
      >
        Skip to main content
      </a>
      <Nav />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Both views stay mounted; CSS hidden preserves DOM state */}
        <div
          id="panel-dashboard"
          role="tabpanel"
          aria-labelledby="tab-dashboard"
          aria-hidden={currentView !== 'dashboard'}
          className={currentView !== 'dashboard' ? 'hidden' : undefined}
        >
          <Dashboard />
        </div>
        <div
          id="panel-input-studio"
          role="tabpanel"
          aria-labelledby="tab-input-studio"
          aria-hidden={currentView !== 'input-studio'}
          className={currentView !== 'input-studio' ? 'hidden' : undefined}
        >
          <InputStudio />
        </div>
      </main>

      <Toast />
      <Onboarding />
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
