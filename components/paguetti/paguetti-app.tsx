'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Calculator } from 'lucide-react'
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

export function PaguettiApp() {
  const [isDark, setIsDark] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [isCalculated, setIsCalculated] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [mounted, setMounted] = useState(false)

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
      if (next.length < 2) setIsCalculated(false)
      return next
    })
  }

  const handleCalculate = () => {
    if (people.length >= 2) setIsCalculated(true)
  }

  const result: CalculationResult | null =
    isCalculated && people.length >= 2 ? calculateTransfers(people) : null

  const shareText = result ? buildShareText(result) : ''
  const canCalculate = people.length >= 2

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[480px] px-3.5 pb-10 pt-2 flex flex-col gap-3">
        {/* Header */}
        <header className="relative pt-1 pb-1">
          <div className="absolute top-0 right-0 z-10">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} mounted={mounted} />
          </div>

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

        {/* Form */}
        <section
          aria-label="Agregar persona"
          className="rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card px-3.5 py-3 shadow-[var(--shadow-surface)] dark:border-border dark:shadow-none"
        >
          <PersonForm onAdd={handleAdd} focusTrigger={focusTrigger} />
        </section>

        {/* People list */}
        <section aria-label="Personas cargadas" className="flex flex-col gap-2">
          {people.length === 0 ? (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/40 px-3 py-3"
            >
              <Image
                src="/small-logo.png"
                alt=""
                width={32}
                height={32}
                aria-hidden
                className="size-8 shrink-0 object-contain opacity-50"
              />
              <p className="text-[13px] text-muted-foreground leading-snug">
                Todavía no cargaste a nadie.{' '}
                <span className="text-secondary-foreground">Sumá al primero del grupo.</span>
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground font-medium px-0.5">
                {people.length} {people.length === 1 ? 'persona' : 'personas'} en el grupo
              </p>

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

        {/* Calculate */}
        {people.length >= 1 && (
          <section aria-label="Calcular reparto">
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
          </section>
        )}

        {/* Results */}
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
