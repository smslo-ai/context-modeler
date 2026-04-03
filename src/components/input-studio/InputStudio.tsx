import { motion, useReducedMotion } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowForm } from './WorkflowForm'
import { SystemForm } from './SystemForm'
import { PersonaForm } from './PersonaForm'
import { ImportExportBar } from './ImportExportBar'

export function InputStudio() {
  const prefersReduced = useReducedMotion()

  const fadeUp = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
      }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="modern-box overflow-hidden">
          <div className="bg-accent/20 border-b border-white/5 px-6 py-5">
            <h2 className="text-foreground font-[family-name:var(--font-display)] text-2xl font-bold">
              Ontology Input Studio
            </h2>
            <p className="text-foreground-muted mt-1 text-sm">
              Define the nodes of your workplace graph. Link systems to workflows to build the
              ontology.
            </p>
            <div className="mt-4">
              <ImportExportBar />
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="workflows">
              <TabsList variant="line" className="mb-6 w-full">
                <TabsTrigger value="workflows" className="flex-1">
                  1. Workflows
                </TabsTrigger>
                <TabsTrigger value="systems" className="flex-1">
                  2. Systems & Infra
                </TabsTrigger>
                <TabsTrigger value="personas" className="flex-1">
                  3. Business Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workflows">
                <WorkflowForm />
              </TabsContent>
              <TabsContent value="systems">
                <SystemForm />
              </TabsContent>
              <TabsContent value="personas">
                <PersonaForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
