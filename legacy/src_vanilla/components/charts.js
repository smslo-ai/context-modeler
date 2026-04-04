import {
  Chart,
  RadarController,
  BubbleController,
  RadialLinearScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

// Tree-shaken registration — only components we actually use
Chart.register(
  RadarController,
  BubbleController,
  RadialLinearScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

let radarChart = null
let bubbleChart = null

const radarConfig = {
  type: 'radar',
  data: {
    labels: ['Workflow Def', 'Sys Integration', 'Persona Aware', 'Data Struct', 'Automation'],
    datasets: [
      {
        label: 'Current Maturity',
        data: [40, 85, 30, 60, 45],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
      },
      {
        label: 'Target State',
        data: [90, 95, 90, 90, 85],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgb(16, 185, 129)',
        borderDash: [5, 5],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: '#e2e8f0' },
        grid: { color: '#e2e8f0' },
        pointLabels: {
          font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
          color: '#475569',
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { display: false },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, font: { family: "'Inter', sans-serif" } },
      },
    },
  },
}

const bubbleConfig = {
  type: 'bubble',
  data: {
    datasets: [{
      label: 'Workflow Items',
      data: [
        { x: 80, y: 90, r: 17, label: 'Mgmt Escalations' },
        { x: 20, y: 30, r: 10, label: 'Timesheets' },
        { x: 60, y: 70, r: 12, label: 'System Maint' },
        { x: 90, y: 85, r: 22, label: 'Strat Planning' },
        { x: 40, y: 60, r: 8,  label: 'Email Triage' },
        { x: 75, y: 20, r: 15, label: 'Legacy Migration' },
        { x: 15, y: 10, r: 5,  label: 'Password Reset' },
      ],
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Contextual Complexity', font: { family: "'Inter', sans-serif" } },
        min: 0, max: 100, grid: { color: '#f1f5f9' },
      },
      y: {
        title: { display: true, text: 'Strategic Value', font: { family: "'Inter', sans-serif" } },
        min: 0, max: 100, grid: { color: '#f1f5f9' },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, font: { family: "'Inter', sans-serif" } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const p = context.raw
            return `${p.label}: Complexity ${p.x}, Value ${p.y}`
          },
        },
      },
    },
  },
}

export function initCharts() {
  const radarEl = document.getElementById('chart-radar')
  const bubbleEl = document.getElementById('chart-bubble')

  if (radarEl && !radarChart) {
    try {
      radarChart = new Chart(radarEl, radarConfig)
    } catch (e) {
      console.warn('[charts] Radar chart failed to initialize:', e.message)
    }
  }

  if (bubbleEl && !bubbleChart) {
    try {
      bubbleChart = new Chart(bubbleEl, bubbleConfig)
    } catch (e) {
      console.warn('[charts] Bubble chart failed to initialize:', e.message)
    }
  }

  // ── A11Y-02: Text alternatives for canvas charts ──────────────────────────
  if (radarEl) {
    radarEl.setAttribute('role', 'img')
    radarEl.setAttribute('aria-label',
      'Radar chart: Ontology Readiness Score. Current Maturity — Workflow Def: 40%, System Integration: 85%, Persona Awareness: 30%, Data Structure: 60%, Automation: 45%. Target State — all dimensions 85-95%.')

    const srTable = document.createElement('table')
    srTable.className = 'sr-only'
    srTable.innerHTML = `
      <caption>Ontology Readiness Score Data</caption>
      <thead><tr><th scope="col">Dimension</th><th scope="col">Current Maturity</th><th scope="col">Target State</th></tr></thead>
      <tbody>
        <tr><th scope="row">Workflow Definition</th><td>40%</td><td>90%</td></tr>
        <tr><th scope="row">System Integration</th><td>85%</td><td>95%</td></tr>
        <tr><th scope="row">Persona Awareness</th><td>30%</td><td>90%</td></tr>
        <tr><th scope="row">Data Structure</th><td>60%</td><td>90%</td></tr>
        <tr><th scope="row">Automation</th><td>45%</td><td>85%</td></tr>
      </tbody>
    `
    radarEl.parentNode?.insertAdjacentElement('beforeend', srTable)
  }

  if (bubbleEl) {
    bubbleEl.setAttribute('role', 'img')
    bubbleEl.setAttribute('aria-label',
      'Bubble chart: Responsibility Mapping. Shows 7 workflow items plotted by Contextual Complexity (x-axis) vs Strategic Value (y-axis). Strategic Planning has highest complexity (90) and value (85). Password Reset has lowest complexity (15) and value (10).')

    const srTable2 = document.createElement('table')
    srTable2.className = 'sr-only'
    srTable2.innerHTML = `
      <caption>Responsibility Mapping Data</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">Complexity</th><th scope="col">Strategic Value</th></tr></thead>
      <tbody>
        <tr><th scope="row">Mgmt Escalations</th><td>80</td><td>90</td></tr>
        <tr><th scope="row">Timesheets</th><td>20</td><td>30</td></tr>
        <tr><th scope="row">System Maintenance</th><td>60</td><td>70</td></tr>
        <tr><th scope="row">Strategic Planning</th><td>90</td><td>85</td></tr>
        <tr><th scope="row">Email Triage</th><td>40</td><td>60</td></tr>
        <tr><th scope="row">Legacy Migration</th><td>75</td><td>20</td></tr>
        <tr><th scope="row">Password Reset</th><td>15</td><td>10</td></tr>
      </tbody>
    `
    bubbleEl.parentNode?.insertAdjacentElement('beforeend', srTable2)
  }
}

export function destroyCharts() {
  radarChart?.destroy()
  bubbleChart?.destroy()
  radarChart = null
  bubbleChart = null
}
