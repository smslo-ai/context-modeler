const EXPORT_VERSION = '1.0'

export function exportOntologyData(state) {
  const exportObj = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    ontologyData: state.ontologyData,
  }
  const json = JSON.stringify(exportObj, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `workplace-model-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importOntologyData(file, onSuccess, onError) {
  if (!file || file.type !== 'application/json') {
    onError('Please select a valid JSON file.')
    return
  }
  if (file.size > 512 * 1024) {  // 512KB max
    onError('File is too large (max 512KB).')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result)

      // Basic validation
      if (!parsed.ontologyData) throw new Error('Invalid file: missing ontologyData')
      const { workflows, systems, personas } = parsed.ontologyData
      if (!Array.isArray(workflows) || !Array.isArray(systems) || !Array.isArray(personas)) {
        throw new Error('Invalid file: workflows, systems, personas must be arrays')
      }
      if (workflows.length > 50 || systems.length > 50 || personas.length > 50) {
        throw new Error('Too many nodes (max 50 per type)')
      }

      onSuccess(parsed.ontologyData)
    } catch (err) {
      onError(`Import failed: ${err.message}`)
    }
  }
  reader.onerror = () => onError('Could not read file.')
  reader.readAsText(file)
}
