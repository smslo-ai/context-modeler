import { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController,
  BubbleController,
  LinearScale,
} from 'chart.js'
import { useOntology } from '@/hooks/useOntology'
import { calculateFriction } from '@/utils/heuristics'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController,
  BubbleController,
  LinearScale,
)

export function Charts() {
  const { workflows, systems, frictionRules, contextMap } = useOntology()
  const radarRef = useRef<HTMLCanvasElement>(null)
  const bubbleRef = useRef<HTMLCanvasElement>(null)
  const radarChartRef = useRef<ChartJS | null>(null)
  const bubbleChartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    if (!radarRef.current) return

    radarChartRef.current?.destroy()

    const radarData = workflows.map((wf) => {
      const scores = systems.map((sys) => calculateFriction(wf, sys, frictionRules))
      const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1)
      return Math.round((1 - avg) * 100)
    })

    radarChartRef.current = new ChartJS(radarRef.current, {
      type: 'radar',
      data: {
        labels: workflows.map((wf) => wf.name),
        datasets: [
          {
            label: 'Readiness %',
            data: radarData,
            backgroundColor: 'rgba(59,155,143,0.2)',
            borderColor: '#3B9B8F',
            pointBackgroundColor: '#FFB162',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#9DAFC5' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#B8C5D4', font: { size: 11 } },
          },
        },
        plugins: {
          legend: { labels: { color: '#B8C5D4' } },
        },
      },
    })

    return () => {
      radarChartRef.current?.destroy()
    }
  }, [workflows, systems, frictionRules])

  useEffect(() => {
    if (!bubbleRef.current) return

    bubbleChartRef.current?.destroy()

    const bubbleData = systems.map((sys) => {
      const linkedWfs = (contextMap[sys.id] ?? []).filter((id) => id.startsWith('wf-'))
      const linkedUsrs = (contextMap[sys.id] ?? []).filter((id) => id.startsWith('usr-'))
      const scores = workflows.map((wf) => calculateFriction(wf, sys, frictionRules))
      const avgFriction = scores.reduce((a, b) => a + b, 0) / (scores.length || 1)
      return { x: linkedWfs.length, y: linkedUsrs.length, r: avgFriction * 20 + 5 }
    })

    bubbleChartRef.current = new ChartJS(bubbleRef.current, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Systems',
            data: bubbleData,
            backgroundColor: systems.map((_, i) => {
              const colors = ['#3B9B8F', '#FFB162', '#317371', '#A35139', '#FFC480']
              return colors[i % colors.length] + '80'
            }),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Linked Workflows', color: '#B8C5D4' },
            ticks: { color: '#9DAFC5' },
            grid: { color: 'rgba(255,255,255,0.08)' },
          },
          y: {
            title: { display: true, text: 'Linked Users', color: '#B8C5D4' },
            ticks: { color: '#9DAFC5' },
            grid: { color: 'rgba(255,255,255,0.08)' },
          },
        },
        plugins: {
          legend: { labels: { color: '#B8C5D4' } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const sys = systems[ctx.dataIndex]
                return sys ? sys.name : ''
              },
            },
          },
        },
      },
    })

    return () => {
      bubbleChartRef.current?.destroy()
    }
  }, [systems, workflows, frictionRules, contextMap])

  return (
    <section aria-labelledby="charts-heading">
      <h2
        id="charts-heading"
        className="text-foreground mb-4 font-[family-name:var(--font-display)] text-xl font-bold"
      >
        Data Visualizations
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="modern-box p-4">
          <h3 className="text-foreground-muted mb-2 text-sm font-semibold">
            Ontology Readiness Score
          </h3>
          <div className="h-[260px] sm:h-[300px] md:h-[350px]">
            <canvas
              ref={radarRef}
              role="img"
              aria-label="Radar chart showing ontology readiness scores per workflow. Higher values mean lower friction."
            />
          </div>
        </div>
        <div className="modern-box p-4">
          <h3 className="text-foreground-muted mb-2 text-sm font-semibold">
            Responsibility Mapping
          </h3>
          <div className="h-[260px] sm:h-[300px] md:h-[350px]">
            <canvas
              ref={bubbleRef}
              role="img"
              aria-label="Bubble chart mapping systems by workflow count, user count, and average friction."
            />
          </div>
        </div>
      </div>
    </section>
  )
}
