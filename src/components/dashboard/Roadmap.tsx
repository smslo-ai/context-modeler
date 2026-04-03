import { Badge } from '@/components/ui/badge'
import { LockedAiButton } from './LockedAiButton'

const ROADMAP_ITEMS = [
  {
    step: 1,
    title: 'Define the Schema',
    description:
      'Map your workplace entities — workflows, systems, and personas — into a structured ontology.',
  },
  {
    step: 2,
    title: 'Build Context Gates',
    description:
      'Define rules that control which information reaches each persona at the right time.',
  },
  {
    step: 3,
    title: 'Deploy Semantic Layer',
    description: 'Connect your ontology to real systems via APIs, creating a live context mesh.',
  },
  {
    step: 4,
    title: 'Measure & Iterate',
    description: 'Track friction scores over time and refine rules based on real usage patterns.',
  },
]

export function Roadmap() {
  return (
    <section aria-labelledby="roadmap-heading">
      <h2
        id="roadmap-heading"
        className="text-foreground mb-4 font-[family-name:var(--font-display)] text-xl font-bold"
      >
        Implementation Roadmap
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {ROADMAP_ITEMS.map(({ step, title, description }) => (
          <div key={step} className="modern-box-sm p-5">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline">{step}</Badge>
              <h3 className="text-foreground text-sm font-semibold">{title}</h3>
            </div>
            <p className="text-foreground-muted mb-4 text-xs leading-relaxed">{description}</p>
            <LockedAiButton label="Explore with AI" />
          </div>
        ))}
      </div>
    </section>
  )
}
