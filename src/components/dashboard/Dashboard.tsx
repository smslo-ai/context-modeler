import { Hero } from './Hero'
import { TriadExplorer } from './TriadExplorer'
import { InsightPanel } from './InsightPanel'
import { Heatmap } from './Heatmap'
import { Charts } from './Charts'
import { Roadmap } from './Roadmap'

export function Dashboard() {
  return (
    <div className="space-y-10">
      <Hero />
      <TriadExplorer />
      <InsightPanel />
      <Heatmap />
      <Charts />
      <Roadmap />
    </div>
  )
}
