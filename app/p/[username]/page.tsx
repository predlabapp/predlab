import { redirect } from 'next/navigation'

export default function ProfileFallback({ params }: { params: { username: string } }) {
  redirect(`/en/p/${params.username}`)
}
