import { useState } from 'react'
import { useOntology } from '@/hooks/useOntology'
import { calculateFriction } from '@/utils/heuristics'
import { sanitizeHTML } from '@/utils/sanitize'
import { HeatmapCell } from './HeatmapCell'
import { FrictionModal } from './FrictionModal'

export function Heatmap() {
  const { workflows, systems, frictionRules } = useOntology()
  const [openCell, setOpenCell] = useState<{ wfIdx: number; sysIdx: number } | null>(null)

  const openWorkflow = openCell ? workflows[openCell.wfIdx] : null
  const openSystem = openCell ? systems[openCell.sysIdx] : null
  const openScore =
    openWorkflow && openSystem ? calculateFriction(openWorkflow, openSystem, frictionRules) : 0

  return (
    <section aria-labelledby="heatmap-heading">
      <h2
        id="heatmap-heading"
        className="text-foreground mb-4 font-[family-name:var(--font-display)] text-xl font-bold"
      >
        Cognitive Friction Heatmap
      </h2>
      <p className="text-foreground-muted mb-4 text-sm">
        Each cell shows how well a workflow fits a system. Green = natural fit. Red = high
        context-switching overhead. Click any cell for details.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Workflow-System Friction Heatmap</caption>
          <thead>
            <tr>
              <th scope="col" className="text-foreground-muted p-2 text-left text-xs font-semibold">
                System / Workflow
              </th>
              {workflows.map((wf) => (
                <th
                  key={wf.id}
                  scope="col"
                  className="text-foreground-muted p-2 text-center text-xs font-semibold"
                >
                  {sanitizeHTML(wf.name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {systems.map((sys, sysIdx) => (
              <tr key={sys.id}>
                <th
                  scope="row"
                  className="text-foreground-muted p-2 text-left text-xs font-semibold whitespace-nowrap"
                >
                  {sanitizeHTML(sys.name)}
                </th>
                {workflows.map((wf, wfIdx) => (
                  <HeatmapCell
                    key={`${wf.id}::${sys.id}`}
                    score={calculateFriction(wf, sys, frictionRules)}
                    workflowId={wf.id}
                    workflowName={wf.name}
                    systemId={sys.id}
                    systemName={sys.name}
                    onClick={() => setOpenCell({ wfIdx, sysIdx })}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FrictionModal
        open={openCell !== null}
        onOpenChange={(open) => {
          if (!open) setOpenCell(null)
        }}
        workflowName={openWorkflow?.name ?? ''}
        systemName={openSystem?.name ?? ''}
        score={openScore}
      />
    </section>
  )
}
