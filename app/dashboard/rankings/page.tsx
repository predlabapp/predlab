import { redirect } from 'next/navigation'

export default function RankingsFallback() {
  redirect('/en/dashboard/rankings')
}
