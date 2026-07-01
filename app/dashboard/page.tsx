import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-helpers'
import { DashboardClient } from '@/components/paguetti/dashboard-client'

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login?next=/dashboard')

  return <DashboardClient />
}
