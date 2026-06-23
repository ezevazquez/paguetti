'use client'

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
  mounted?: boolean
  className?: string
}

export function ThemeToggle({ isDark, onToggle, mounted = true, className }: ThemeToggleProps) {
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
        'flex size-8 items-center justify-center rounded-lg',
        'text-muted-foreground/70 transition-colors',
        'hover:bg-muted/60 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40',
        className
      )}
    >
      {mounted && isDark ? (
        <Sun className="size-3.5" aria-hidden="true" />
      ) : (
        <Moon className="size-3.5" aria-hidden="true" />
      )}
    </button>
  )
}
