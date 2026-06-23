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

function CollapseToggle({
  expanded,
  onToggle,
  collapsedLabel,
  expandedLabel,
}: {
  expanded: boolean
  onToggle: () => void
  collapsedLabel: string
  expandedLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground shadow-[var(--shadow-surface)] transition-colors hover:text-foreground dark:border-border dark:shadow-none"
    >
      <span>{expanded ? expandedLabel : collapsedLabel}</span>
      <ChevronDown
        className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
        aria-hidden="true"
      />
    </button>
  )
}

export function PaguettiApp() {
  const [isDark, setIsDark] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [isCalculated, setIsCalculated] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [formExpanded, setFormExpanded] = useState(true)
  const [listExpanded, setListExpanded] = useState(true)

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
        setFormExpanded(true)
        setListExpanded(true)
      }
      return next
    })
  }

  const handleCalculate = () => {
    if (people.length >= 2) {
      setIsCalculated(true)
      setFormExpanded(false)
      setListExpanded(false)
    }
  }

  const handleReset = () => {
    if (!confirm('¿Borrar todo el grupo y empezar de nuevo?')) return
    setPeople([])
    setIsCalculated(false)
    setFormExpanded(true)
    setListExpanded(true)
    setFocusTrigger((n) => n + 1)
  }

  const result: CalculationResult | null =
    isCalculated && people.length >= 2 ? calculateTransfers(people) : null

  const shareText = result ? buildShareText(result) : ''
  const canCalculate = people.length >= 2
  const showForm = !result || formExpanded
  const showList = !result || listExpanded

  const formCard = (
    <div className="flex flex-col gap-2">
      <PersonForm onAdd={handleAdd} focusTrigger={focusTrigger} />
      {people.length >= 1 && (
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!canCalculate}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)*1.4)] border-0 bg-gradient-to-b from-primary to-primary-hover text-base font-bold tracking-tight text-primary-foreground shadow-[var(--shadow-btn)] transition-[filter,transform] hover:brightness-[1.06] active:translate-y-px disabled:cursor-not-allowed disabled:bg-muted disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:opacity-45 disabled:shadow-none"
          aria-disabled={!canCalculate}
        >
          <Calculator className="size-[18px] shrink-0" aria-hidden="true" />
          Calcular reparto
        </button>
      )}
    </div>
  )

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

        {result && (
          <ResultsCard result={result} onShare={() => setShareOpen(true)} />
        )}

        {/* Form */}
        {result ? (
          <section aria-label="Agregar persona" className="flex flex-col gap-2">
            <CollapseToggle
              expanded={formExpanded}
              onToggle={() => setFormExpanded((v) => !v)}
              collapsedLabel="Agregar persona"
              expandedLabel="Ocultar carga"
            />
            {showForm && (
              <div className="rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card px-3.5 py-3 shadow-[var(--shadow-surface)] dark:border-border dark:shadow-none">
                {formCard}
              </div>
            )}
          </section>
        ) : (
          <section
            aria-label="Agregar persona"
            className="rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card px-3.5 py-3 shadow-[var(--shadow-surface)] dark:border-border dark:shadow-none"
          >
            {formCard}
          </section>
        )}

        {/* People list */}
        <section aria-label="Personas cargadas" className={cn('flex flex-col gap-2', !result && 'mt-3')}>
          {people.length === 0 ? (
            <div
              role="status"
              className="rounded-xl border border-dashed border-border/80 bg-card/40 px-3 py-3 text-center"
            >
              <p className="text-[13px] text-muted-foreground leading-snug">
                Todavía no cargaste a nadie.{' '}
                <span className="text-secondary-foreground">Sumá al primero del grupo.</span>
              </p>
            </div>
          ) : result ? (
            <>
              <div className="flex justify-end px-0.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                  Reiniciar
                </button>
              </div>
              <CollapseToggle
                expanded={listExpanded}
                onToggle={() => setListExpanded((v) => !v)}
                collapsedLabel={`${people.length} ${people.length === 1 ? 'persona' : 'personas'} en el grupo`}
                expandedLabel="Ocultar grupo"
              />
              {showList && (
                <ul className="flex flex-col gap-1.5" role="list">
                  {people.map((person) => (
                    <li key={person.id}>
                      <PersonCard
                        person={person}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-0.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  {people.length} {people.length === 1 ? 'persona' : 'personas'} en el grupo
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                  Reiniciar
                </button>
              </div>

              <ul className="flex flex-col gap-1.5" role="list">
                {people.map((person) => (
                  <li key={person.id}>
                    <PersonCard
                      person={person}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </li>
                ))}
              </ul>

              {people.length === 1 && (
                <p role="status" className="text-[11px] text-center text-muted-foreground">
                  Sumá al menos una persona más para calcular.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        text={shareText}
      />
    </main>
  )
}
