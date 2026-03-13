export function HowItWorks() {
  const steps = [
    {
      number: "①",
      emoji: "🌍",
      title: "Escolhe um mercado",
      desc: "do Polymarket ou cria a tua previsão",
      detail: "Mercados sobre política, crypto, economia, esportes e mais",
    },
    {
      number: "②",
      emoji: "📊",
      title: "Define a tua probabilidade",
      desc: "e o teu argumento",
      detail: "De 1% a 99% — sem respostas de sim/não",
    },
    {
      number: "③",
      emoji: "🔥",
      title: "Acompanha, resolve",
      desc: "e partilha os acertos",
      detail: "Forecast Score verificado automaticamente pelo Polymarket",
    },
  ]

  return (
    <section className="border-t border-[var(--border)] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs text-[var(--text-muted)] uppercase tracking-widest font-mono mb-3">
          Como funciona
        </p>
        <h2 className="font-display text-2xl font-bold text-center text-[var(--text-primary)] mb-12">
          Três passos. Uma reputação.
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.number} className="text-center">
              <div className="text-4xl mb-3">{s.emoji}</div>
              <p className="font-mono text-xs text-[var(--accent)] mb-2">{s.number}</p>
              <p className="font-display text-base font-bold text-[var(--text-primary)] mb-1">
                {s.title}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">{s.desc}</p>
              <p className="text-xs text-[var(--text-muted)] italic">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
