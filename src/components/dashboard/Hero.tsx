import { SimulationControl } from './SimulationControl'

export function Hero() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-foreground font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
          Modeling the Context-Aware Enterprise
        </h1>
        <p className="text-foreground-muted mt-3 max-w-2xl text-sm leading-relaxed">
          This tool models a workplace through three lenses — business demand (Workflows), system
          capability (Systems & Infra), and user state (Personas) — to visualize how context flows
          and where friction occurs. Select a simulation mode to see how different work patterns
          reshape the landscape.
        </p>
      </div>
      <SimulationControl />
    </section>
  )
}
