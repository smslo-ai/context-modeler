import type { OntologyData, Workflow, System, Persona, NodeType } from '../types'
import type { StorageAdapter } from './types'

export function createOntologyService(storage: StorageAdapter) {
  function addNode(
    data: OntologyData,
    nodeType: NodeType,
    node: Workflow | System | Persona,
  ): OntologyData {
    let updated: OntologyData

    switch (nodeType) {
      case 'workflow':
        updated = { ...data, workflows: [...data.workflows, node as Workflow] }
        break
      case 'system':
        updated = { ...data, systems: [...data.systems, node as System] }
        break
      case 'persona':
        updated = { ...data, personas: [...data.personas, node as Persona] }
        break
    }

    storage.save(updated)
    return updated
  }

  function removeNode(data: OntologyData, id: string, nodeType: NodeType): OntologyData {
    // 1. Remove from typed array
    const workflows =
      nodeType === 'workflow' ? data.workflows.filter((w) => w.id !== id) : data.workflows
    const systems = nodeType === 'system' ? data.systems.filter((s) => s.id !== id) : data.systems
    const personas =
      nodeType === 'persona' ? data.personas.filter((p) => p.id !== id) : data.personas

    // 2. Cascade: contextMap -- remove key and from all target arrays
    const contextMap = Object.fromEntries(
      Object.entries(data.contextMap)
        .filter(([key]) => key !== id)
        .map(([key, targets]) => [key, targets.filter((t) => t !== id)]),
    )

    // 3. Cascade: frictionRules -- exact segment match
    const frictionRules = Object.fromEntries(
      Object.entries(data.frictionRules).filter(
        ([key]) => !key.startsWith(id + '::') && !key.endsWith('::' + id),
      ),
    )

    // 4. Cascade: linked arrays on remaining nodes
    const cleanedWorkflows = workflows.map((w) => ({
      ...w,
      linkedSystems: w.linkedSystems.filter((sid) => sid !== id),
    }))
    const cleanedSystems = systems.map((s) => ({
      ...s,
      linkedWorkflows: s.linkedWorkflows.filter((wid) => wid !== id),
      linkedUsers: s.linkedUsers.filter((uid) => uid !== id),
    }))

    const updated: OntologyData = {
      ...data,
      workflows: cleanedWorkflows,
      systems: cleanedSystems,
      personas,
      contextMap,
      frictionRules,
    }

    storage.save(updated)
    return updated
  }

  function loadData(): OntologyData {
    return storage.load()
  }

  function saveData(data: OntologyData): void {
    storage.save(data)
  }

  return { addNode, removeNode, loadData, saveData }
}

export type OntologyService = ReturnType<typeof createOntologyService>
