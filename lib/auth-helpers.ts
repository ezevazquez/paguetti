import { createClient } from '@/lib/supabase/server'
import { getPrisma } from '@/lib/prisma'

export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

export async function ensureProfile(user: {
  id: string
  email?: string | null
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string }
}) {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
  const avatarUrl = user.user_metadata?.avatar_url ?? null

  return getPrisma().profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      name,
      avatarUrl,
    },
    update: {
      email: user.email ?? null,
      name,
      avatarUrl,
    },
  })
}
