export function Differentials() {
  const items = [
    {
      icon: "🔒",
      title: "Imutável",
      desc: "Sem edições. Sem exclusões. A reputação é real.",
    },
    {
      icon: "⚡",
      title: "Verificado",
      desc: "Polymarket resolve automaticamente. Sem batota possível.",
    },
    {
      icon: "🏆",
      title: "Rankings",
      desc: "Compete por categoria, cidade e país. Score verificado apenas.",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
