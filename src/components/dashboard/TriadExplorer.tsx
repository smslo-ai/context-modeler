import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useOntology } from '@/hooks/useOntology'
import { NodeCard } from './NodeCard'
import type { NodeType, Workflow, System, Persona } from '@/types'

interface ColumnConfig {
  key: NodeType
  title: string
  description: string
  nodes: (Workflow | System | Persona)[]
}

export function TriadExplorer() {
  const { workflows, systems, personas } = useOntology()

  const columns: ColumnConfig[] = [
    {
      key: 'workflow',
      title: 'Business Workflows',
      description: 'Demand signals and processes',
      nodes: workflows,
    },
    {
      key: 'system',
      title: 'Systems & Infra',
      description: 'Tools and platforms',
      nodes: systems,
    },
    {
      key: 'persona',
      title: 'Users & Personas',
      description: 'People and roles',
      nodes: personas,
    },
  ]

  return (
    <section aria-labelledby="triad-heading">
      <h2
        id="triad-heading"
        className="text-foreground mb-4 font-[family-name:var(--font-display)] text-xl font-bold"
      >
        Context Ontology Explorer
      </h2>

      {/* Desktop: 3-column grid */}
      <div className="hidden gap-6 md:grid md:grid-cols-3">
        {columns.map((col) => (
          <ColumnPanel key={col.key} column={col} />
        ))}
      </div>

      {/* Mobile: tabbed layout */}
      <div className="md:hidden">
        <Tabs defaultValue="workflow">
          <TabsList className="w-full">
            {columns.map((col) => (
              <TabsTrigger key={col.key} value={col.key} className="flex-1">
                {col.title}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {col.nodes.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {columns.map((col) => (
            <TabsContent key={col.key} value={col.key}>
              <ColumnPanel column={col} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}

function ColumnPanel({ column }: { column: ColumnConfig }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-semibold">{column.title}</h3>
          <p className="text-foreground-subtle text-xs">{column.description}</p>
        </div>
        <Badge variant="outline" aria-live="polite" aria-atomic="true">
          {column.nodes.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        {column.nodes.map((node) => (
          <NodeCard key={node.id} node={node} nodeType={column.key} />
        ))}
      </div>
    </div>
  )
}
