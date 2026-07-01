'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { CalendarDays, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/paguetti/theme-toggle'
import { CreateEventDialog } from '@/components/paguetti/create-event-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function getAvatarUrl(user: User): string | undefined {
  const meta = user.user_metadata
  return (
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    undefined
  )
}

function getInitials(user: User): string {
  const name =
    (typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata.name === 'string' && user.user_metadata.name) ||
    user.email ||
    '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const linkTextClass =
  'inline-flex min-h-10 items-center px-1.5 text-[13px] font-semibold text-primary transition-colors hover:text-primary/80 hover:underline'

export function SiteHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const syncUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)
      setReady(true)
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    const onFocus = () => {
      void supabase.auth.getUser()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const handleCreateClick = () => {
    if (!user) {
      router.push('/login')
      return
    }
    setCreateOpen(true)
  }

  const avatarUrl = user ? getAvatarUrl(user) : undefined
  const logoHref = user ? '/dashboard' : '/'

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top,0px)]">
        <div className="pointer-events-none flex h-14 items-center justify-between px-3 sm:px-4">
          <div className="pointer-events-auto">
            <Link
              href={logoHref}
              className="flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-muted/60"
              aria-label={user ? 'Mis eventos' : 'Modo rápido'}
            >
              <Image
                src="/small-logo.png"
                alt="Paguetti"
                width={28}
                height={28}
                className="size-7 object-contain"
                priority
              />
            </Link>
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
            {!ready ? (
              <span className="w-[5.5rem]" aria-hidden="true" />
            ) : (
              <button
                type="button"
                onClick={handleCreateClick}
                className={`${linkTextClass} whitespace-nowrap`}
              >
                Crear Evento
              </button>
            )}

            <ThemeToggle className="size-9" />

            {ready && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="ml-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Menú de cuenta"
                >
                  <Avatar size="default" className="size-8 cursor-pointer sm:size-9">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    nativeButton={false}
                    render={<Link href="/dashboard" />}
                  >
                    <CalendarDays />
                    Ver eventos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                    <LogOut />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>

      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
