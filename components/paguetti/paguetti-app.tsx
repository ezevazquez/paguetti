'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Calculator, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { PersonForm } from './person-form'
import { PersonCard } from './person-card'
import { ResultsCard } from './results-card'
import { ShareModal } from './share-modal'
import {
  type Person,
  type CalculationResult,
  calculateTransfers,
  buildShareText,
  loadPeople,
  savePeople,
} from '@/lib/paguetti'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const WORKBOX_CLASS =
  'rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card shadow-[var(--shadow-surface)] dark:border-border dark:shadow-none'

export function PaguettiApp() {
  const [isDark, setIsDark] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [isCalculated, setIsCalculated] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [workboxExpanded, setWorkboxExpanded] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
    const saved = loadPeople()
    if (saved.length > 0) setPeople(saved)
  }, [])

  useEffect(() => {
    if (mounted) savePeople(people)
  }, [people, mounted])

  const toggleTheme = useCallback(() => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('paguetti-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('paguetti-theme', 'light')
    }
  }, [isDark])

  const handleAdd = (person: Omit<Person, 'id'>) => {
    setPeople((prev) => [...prev, { ...person, id: generateId() }])
    setFocusTrigger((n) => n + 1)
  }

  const handleEdit = (updated: Person) => {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handleDelete = (id: string) => {
    setPeople((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (next.length < 2) {
        setIsCalculated(false)
        setWorkboxExpanded(true)
      }
      return next
    })
  }

  const handleCalculate = () => {
    if (people.length >= 2) {
      setIsCalculated(true)
      setWorkboxExpanded(false)
    }
  }

  const handleReset = () => {
    if (!confirm('¿Borrar todo el grupo y empezar de nuevo?')) return
    setPeople([])
    setIsCalculated(false)
    setWorkboxExpanded(true)
    setFocusTrigger((n) => n + 1)
  }

  const result: CalculationResult | null =
    isCalculated && people.length >= 2 ? calculateTransfers(people) : null

  const shareText = result ? buildShareText(result) : ''
  const canCalculate = people.length >= 2
  const showCollapsed = result && !workboxExpanded

  const peopleLabel = `${people.length} ${people.length === 1 ? 'persona' : 'personas'} en el grupo`

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="fixed top-3.5 right-3.5 z-20">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} mounted={mounted} />
      </div>

      <div
        className={cn(
          'mx-auto w-full max-w-[480px] min-w-0 overflow-x-hidden px-3.5 pb-10 flex flex-col gap-3 transition-[padding-top] duration-300 ease-out',
          people.length === 0 ? 'pt-[22vh] sm:pt-28' : 'pt-8 sm:pt-10'
        )}
      >
        <header className="pb-1">
          <div className="flex flex-col items-center gap-1 px-8">
            <Image
              src="/big-logo.png"
              alt="Paguetti"
              width={280}
              height={80}
              priority
              className="h-10 sm:h-11 w-auto object-contain"
            />
            <p className="text-[13px] text-muted-foreground text-center leading-snug">
              Separá gastos sin drama.
            </p>
          </div>
        </header>

        {/* Unified workbox */}
        <section aria-label="Cargar gastos del grupo">
          {showCollapsed ? (
            <button
              type="button"
              onClick={() => setWorkboxExpanded(true)}
              aria-expanded={false}
              className={cn(
                WORKBOX_CLASS,
                'flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-elevated/50'
              )}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground">{peopleLabel}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Grupo cargado
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary">
                Editar
                <ChevronDown className="size-4" aria-hidden="true" />
              </span>
            </button>
          ) : (
            <div className={cn(WORKBOX_CLASS, 'px-3.5 py-3')}>
              {result && (
                <div className="mb-3 flex items-center justify-end border-b border-border/50 pb-2">
                  <button
                    type="button"
                    onClick={() => setWorkboxExpanded(false)}
                    className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Ocultar
                    <ChevronDown className="size-3.5 rotate-180" aria-hidden="true" />
                  </button>
                </div>
              )}

              <PersonForm onAdd={handleAdd} focusTrigger={focusTrigger} />

              {people.length === 0 ? (
                <p
                  role="status"
                  className="mt-3 border-t border-dashed border-border/70 pt-3 text-center text-[13px] text-muted-foreground leading-snug"
                >
                  Todavía no cargaste a nadie.{' '}
                  <span className="text-secondary-foreground">Sumá al primero del grupo.</span>
                </p>
              ) : (
                <div className="mt-3 border-t border-border/60 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground">{peopleLabel}</p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Reiniciar
                    </button>
                  </div>

                  <ul className="flex flex-col" role="list">
                    {people.map((person) => (
                      <li key={person.id}>
                        <PersonCard
                          person={person}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          embedded
                        />
                      </li>
                    ))}
                  </ul>

                  {people.length === 1 && (
                    <p role="status" className="text-[11px] text-center text-muted-foreground">
                      Sumá al menos una persona más para calcular.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={!canCalculate}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)*1.2)] border-0 bg-gradient-to-b from-primary to-primary-hover text-base font-bold tracking-tight text-primary-foreground shadow-[var(--shadow-btn)] transition-[filter,transform] hover:brightness-[1.06] active:translate-y-px disabled:cursor-not-allowed disabled:bg-muted disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:opacity-45 disabled:shadow-none"
                    aria-disabled={!canCalculate}
                  >
                    <Calculator className="size-[18px] shrink-0" aria-hidden="true" />
                    Calcular reparto
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {result && (
          <ResultsCard result={result} onShare={() => setShareOpen(true)} />
        )}
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        text={shareText}
      />
    </main>
  )
}
