import { AppProvider, useApp } from '@/context/AppContext'
import { Nav } from '@/components/nav/Nav'
import { Toast } from '@/components/shared/Toast'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { InputStudio } from '@/components/input-studio/InputStudio'

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
