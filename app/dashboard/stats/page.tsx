import { redirect } from 'next/navigation'

export default function StatsFallback() {
  redirect('/en/dashboard/stats')
}
