import type { OntologyData } from '../types'

export interface StorageAdapter {
  load(): OntologyData
  save(data: OntologyData): void
}
