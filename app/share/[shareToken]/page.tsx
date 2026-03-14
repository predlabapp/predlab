import { redirect } from 'next/navigation'

export default function ShareFallback({ params }: { params: { shareToken: string } }) {
  redirect(`/en/share/${params.shareToken}`)
}
