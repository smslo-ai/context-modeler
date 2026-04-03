import { motion, useReducedMotion } from 'motion/react'
import { Hero } from './Hero'
import { TriadExplorer } from './TriadExplorer'
import { InsightPanel } from './InsightPanel'
import { Heatmap } from './Heatmap'
import { Charts } from './Charts'
import { Roadmap } from './Roadmap'

export function Dashboard() {
  const prefersReduced = useReducedMotion()

  const fadeUp = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }

  function stagger(delay: number) {
    return prefersReduced ? {} : { transition: { duration: 0.4, delay } }
  }

  return (
    <div className="space-y-10">
      <motion.div {...fadeUp} {...stagger(0)}>
        <Hero />
      </motion.div>
      <motion.div {...fadeUp} {...stagger(0.1)}>
        <TriadExplorer />
      </motion.div>
      <InsightPanel />
      <motion.div {...fadeUp} {...stagger(0.2)}>
        <Heatmap />
      </motion.div>
      <motion.div {...fadeUp} {...stagger(0.3)}>
        <Charts />
      </motion.div>
      <motion.div {...fadeUp} {...stagger(0.4)}>
        <Roadmap />
      </motion.div>
    </div>
  )
}
