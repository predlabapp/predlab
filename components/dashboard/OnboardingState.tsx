"use client"

import { Plus } from "lucide-react"

interface Props {
  onFreeForm: () => void
}

export function OnboardingState({ onFreeForm }: Props) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <p className="text-3xl mb-3">☝️</p>
      <h3 className="font-display text-lg font-semibold mb-2">
        Escolhe um mercado acima ou cria a tua primeira previsão
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
        As previsões são imutáveis após criação. Tens 10 minutos para apagar se mudares de ideias.
      </p>
      <button
        onClick={onFreeForm}
        className="btn-ghost inline-flex items-center gap-2"
      >
        <Plus size={15} />
        Previsão livre (qualquer tema)
      </button>
    </div>
  )
}
