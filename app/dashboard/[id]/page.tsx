import { redirect } from 'next/navigation'

export default function PredictionFallback({ params }: { params: { id: string } }) {
  redirect(`/en/dashboard/${params.id}`)
}
