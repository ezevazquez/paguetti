'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  const onToggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('paguetti-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('paguetti-theme', 'light')
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        mounted
          ? isDark
            ? 'Cambiar a modo claro'
            : 'Cambiar a modo oscuro'
          : 'Cambiar tema'
      }
      className={cn(
        'flex size-10 items-center justify-center rounded-xl',
        'text-muted-foreground transition-colors',
        'hover:bg-muted/60 hover:text-foreground',
        'focus-visible:outline-none',
        className
      )}
    >
      {mounted && isDark ? (
        <Sun className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  )
}
