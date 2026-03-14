import { redirect } from 'next/navigation'

export default function DashboardFallback() {
  redirect('/en/dashboard')
}
