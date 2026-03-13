import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Category, Resolution } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy", { locale: ptBR })
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function isExpired(date: Date | string): boolean {
  return isPast(new Date(date))
}

export function getProbabilityColor(probability: number): string {
  if (probability >= 70) return "var(--green)"
  if (probability >= 40) return "var(--yellow)"
  if (probability >= 20) return "var(--orange)"
  return "var(--red)"
}

export function getProbabilityLabel(probability: number): string {
  if (probability >= 80) return "Muito provável"
  if (probability >= 60) return "Provável"
  if (probability >= 40) return "Incerto"
  if (probability >= 20) return "Improvável"
  return "Muito improvável"
}

export const CATEGORIES: Record<Category, { label: string; emoji: string }> = {
  TECHNOLOGY: { label: "Tecnologia", emoji: "💻" },
  ECONOMY: { label: "Economia", emoji: "📈" },
  MARKETS: { label: "Mercados", emoji: "💹" },
  STARTUPS: { label: "Startups", emoji: "🚀" },
  GEOPOLITICS: { label: "Geopolítica", emoji: "🌍" },
  SCIENCE: { label: "Ciência", emoji: "🔬" },
  SPORTS: { label: "Desporto", emoji: "⚽" },
  CULTURE: { label: "Cultura", emoji: "🎨" },
  OTHER: { label: "Outro", emoji: "📌" },
}

export const RESOLUTION_CONFIG: Record<
  Resolution,
  { label: string; color: string; bg: string }
> = {
  CORRECT: {
    label: "Correto",
    color: "var(--green)",
    bg: "rgba(52,211,153,0.1)",
  },
  INCORRECT: {
    label: "Incorreto",
    color: "var(--red)",
    bg: "rgba(248,113,113,0.1)",
  },
  PARTIAL: {
    label: "Parcial",
    color: "var(--yellow)",
    bg: "rgba(251,191,36,0.1)",
  },
  CANCELLED: {
    label: "Cancelado",
    color: "var(--text-muted)",
    bg: "rgba(85,85,112,0.15)",
  },
}

// Brier-like accuracy score (0 to 1, higher is better)
// For a single prediction: score = 1 - (p - o)^2
// where p = probability (0-1) and o = outcome (1 for correct, 0 for incorrect)
export function brierScore(probability: number, resolution: Resolution): number {
  const p = probability / 100
  if (resolution === "CORRECT") return 1 - Math.pow(p - 1, 2)
  if (resolution === "INCORRECT") return 1 - Math.pow(p - 0, 2)
  if (resolution === "PARTIAL") return 1 - Math.pow(p - 0.5, 2)
  return 0
}

export function calculateAccuracyScore(
  predictions: Array<{ probability: number; resolution: Resolution | null }>
): number {
  const resolved = predictions.filter(
    (p) => p.resolution && p.resolution !== "CANCELLED"
  )
  if (resolved.length === 0) return 0
  const total = resolved.reduce(
    (sum, p) => sum + brierScore(p.probability, p.resolution!),
    0
  )
  return Math.round((total / resolved.length) * 100)
}
