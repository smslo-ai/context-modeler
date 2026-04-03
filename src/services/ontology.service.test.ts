import { describe, it, expect, vi } from 'vitest'
import { createOntologyService } from './ontology.service'
import { getDefaultData } from '../data/defaults'
import type { StorageAdapter } from './types'
import type { Workflow, System, Persona } from '../types'

function mockStorage(): StorageAdapter {
  const data = getDefaultData()
  return {
    load: vi.fn(() => data),
    save: vi.fn(),
  }
}

describe('createOntologyService', () => {
  describe('addNode', () => {
    it('adds a workflow', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const newWf: Workflow = {
        id: 'wf-new',
        name: 'New WF',
        type: 'routine',
        description: '',
        owner: '',
        frequency: 'daily',
        linkedSystems: [],
      }

      const result = service.addNode(data, 'workflow', newWf)
      expect(result.workflows.find((w) => w.id === 'wf-new')).toBeTruthy()
      expect(storage.save).toHaveBeenCalledWith(result)
    })

    it('adds a system', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const newSys: System = {
        id: 'sys-new',
        name: 'New Sys',
        category: 'storage',
        description: '',
        linkedWorkflows: [],
        linkedUsers: [],
      }

      const result = service.addNode(data, 'system', newSys)
      expect(result.systems.find((s) => s.id === 'sys-new')).toBeTruthy()
    })

    it('adds a persona', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const newP: Persona = { id: 'usr-new', name: 'New User', state: 'test', description: '' }

      const result = service.addNode(data, 'persona', newP)
      expect(result.personas.find((p) => p.id === 'usr-new')).toBeTruthy()
    })
  })

  describe('removeNode', () => {
    it('removes a workflow from the array', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const wfId = data.workflows[0]!.id

      const result = service.removeNode(data, wfId, 'workflow')
      expect(result.workflows.find((w) => w.id === wfId)).toBeUndefined()
    })

    it('cascades removal from contextMap keys', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const wfId = 'wf-mgmt-escalations'

      const result = service.removeNode(data, wfId, 'workflow')
      expect(result.contextMap[wfId]).toBeUndefined()
    })

    it('cascades removal from contextMap target arrays', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const wfId = 'wf-mgmt-escalations'

      const result = service.removeNode(data, wfId, 'workflow')
      for (const targets of Object.values(result.contextMap)) {
        expect(targets).not.toContain(wfId)
      }
    })

    it('cascades removal from frictionRules', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const wfId = 'wf-mgmt-escalations'

      const result = service.removeNode(data, wfId, 'workflow')
      for (const key of Object.keys(result.frictionRules)) {
        expect(key).not.toContain(wfId)
      }
    })

    it('cascades removal from system linkedWorkflows', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const wfId = 'wf-mgmt-escalations'

      const result = service.removeNode(data, wfId, 'workflow')
      for (const sys of result.systems) {
        expect(sys.linkedWorkflows).not.toContain(wfId)
      }
    })

    it('cascades removal of system from workflow linkedSystems', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const sysId = 'sys-jira'

      const result = service.removeNode(data, sysId, 'system')
      for (const wf of result.workflows) {
        expect(wf.linkedSystems).not.toContain(sysId)
      }
    })

    it('cascades removal of persona from system linkedUsers', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()
      const usrId = 'usr-firefighter'

      const result = service.removeNode(data, usrId, 'persona')
      for (const sys of result.systems) {
        expect(sys.linkedUsers).not.toContain(usrId)
      }
    })

    it('calls storage.save after removal', () => {
      const storage = mockStorage()
      const service = createOntologyService(storage)
      const data = getDefaultData()

      service.removeNode(data, 'wf-mgmt-escalations', 'workflow')
      expect(storage.save).toHaveBeenCalled()
    })
  })
})
