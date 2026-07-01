'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Calculator, Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PersonForm } from './person-form'
import { PersonCard } from './person-card'
import { ResultsCard } from './results-card'
import { ShareModal } from './share-modal'
import { btnSecondaryClass } from './button-styles'
import type { EventParticipantDto } from '@/lib/events-mapper'
import type { Person, CalculationResult } from '@/lib/paguetti'
import { buildShareText, formatARS } from '@/lib/paguetti'
import { getGuestEntry, setGuestEntry, clearGuestEntry } from '@/lib/guest-storage'

type EventInfo = {
  id: string
  slug: string
  title: string | null
  status: string
  hostId: string
  hostName: string | null
  isHost: boolean
}

type EventData = {
  event: EventInfo
  participants: EventParticipantDto[]
}

function toPerson(p: EventParticipantDto): Person {
  return {
    id: p.id,
    name: p.name,
    alias: p.alias,
    amount: p.amount,
    didNotPay: p.didNotPay || undefined,
  }
}

export function EventPageClient({ slug }: { slug: string }) {
  const [data, setData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [guestToken, setGuestToken] = useState<string | null>(null)

  const eventUrl = typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : ''

  const loadEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)

      const stored = getGuestEntry(json.event.id)
      setGuestToken(stored?.token ?? null)
    } catch {
      toast.error('No se pudo cargar el evento.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  const authHeaders = (): HeadersInit => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (guestToken) headers['x-guest-token'] = guestToken
    return headers
  }

  const handleAdd = async (person: Omit<Person, 'id'>, asHost = false) => {
    if (!data) return

    const res = await fetch(`/api/events/${slug}/participants`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: person.name,
        alias: person.alias,
        amount: person.amount,
        didNotPay: person.didNotPay,
        asHost,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'No se pudo agregar.')
      return
    }

    if (json.guestToken) {
      setGuestEntry(data.event.id, {
        participantId: json.participant.id,
        token: json.guestToken,
      })
      setGuestToken(json.guestToken)
    }

    setFocusTrigger((n) => n + 1)
    setResult(null)
    await loadEvent()
    toast.success(asHost ? 'Persona agregada.' : '¡Listo! Cargaste tu gasto.')
  }

  const handleEdit = async (updated: Person) => {
    const res = await fetch(`/api/events/${slug}/participants/${updated.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: updated.name,
        alias: updated.alias,
        amount: updated.amount,
        didNotPay: updated.didNotPay,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'No se pudo editar.')
      return
    }

    setResult(null)
    await loadEvent()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/events/${slug}/participants/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'No se pudo eliminar.')
      return
    }

    if (data) {
      const stored = getGuestEntry(data.event.id)
      if (stored?.participantId === id) {
        clearGuestEntry(data.event.id)
        setGuestToken(null)
      }
    }

    setResult(null)
    await loadEvent()
  }

  const handleCalculate = async () => {
    const res = await fetch(`/api/events/${slug}/calculate`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'No se pudo calcular.')
      return
    }
    setResult(json.result)
    await loadEvent()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl)
      setCopiedLink(true)
      toast.success('Link copiado.')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error('No se pudo copiar el link.')
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-3.5 py-10">
        <p className="text-[13px] text-muted-foreground">Cargando evento…</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-3.5 py-10">
        <p className="text-[13px] text-muted-foreground">Evento no encontrado.</p>
        <Link href="/" className="text-[13px] text-primary font-medium">Volver al inicio</Link>
      </main>
    )
  }

  const { event, participants } = data
  const people = participants.map(toPerson)
  const total = people.reduce((sum, p) => sum + p.amount, 0)
  const shareText = result ? buildShareText(result) : ''
  const storedGuest = data ? getGuestEntry(data.event.id) : null
  const ownParticipant = storedGuest
    ? participants.find((p) => p.id === storedGuest.participantId)
    : null
  const canCalculate = participants.length >= 2
  const isHost = event.isHost
  const showParticipantForm = !isHost && !ownParticipant && event.status !== 'closed'
  const displayTitle = event.title?.trim() || 'Evento compartido'

  return (
    <main className="relative flex min-h-svh flex-col justify-center overflow-x-hidden bg-background px-3.5 py-10">
      <div className="mx-auto flex w-full max-w-[480px] min-w-0 flex-col gap-3">
        <h1 className="px-2 text-center text-[22px] font-bold leading-tight text-foreground sm:text-2xl">
          {displayTitle}
        </h1>

        {isHost && (
          <div className="flex gap-2">
            <input
              readOnly
              value={eventUrl}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border/90 bg-white px-3 text-[12px] text-foreground dark:bg-secondary"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(btnSecondaryClass, 'h-10 shrink-0 px-3')}
              aria-label="Copiar link"
            >
              {copiedLink ? <Check className="size-4 text-lime" /> : <Copy className="size-4" />}
            </button>
          </div>
        )}

        <section className="rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card px-3.5 py-3 shadow-[var(--shadow-surface)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              {participants.length} {participants.length === 1 ? 'persona' : 'personas'} · Total {formatARS(total)}
            </p>
            <button
              type="button"
              onClick={loadEvent}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Actualizar"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>

          {isHost ? (
            <>
              <PersonForm
                onAdd={(person) => handleAdd(person, true)}
                focusTrigger={focusTrigger}
              />
              <p className="text-[11px] text-muted-foreground text-center mt-2 mb-1">
                Como admin podés agregar quién no puso plata.
              </p>
            </>
          ) : showParticipantForm ? (
            <PersonForm onAdd={(person) => handleAdd(person, false)} focusTrigger={focusTrigger} />
          ) : ownParticipant ? (
            <div className="mb-3 rounded-lg bg-background/60 px-2.5 py-2">
              <p className="text-[13px] text-foreground font-medium">Ya cargaste tu gasto</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Podés editarlo abajo. Si cambiás de navegador, tendrás que volver a cargar.
              </p>
            </div>
          ) : null}

          {participants.length > 0 && (
            <ul className="flex flex-col mt-3 border-t border-border/60 pt-3" role="list">
              {participants.map((p) => {
                const person = toPerson(p)
                const canEdit =
                  isHost ||
                  (ownParticipant?.id === p.id) ||
                  (storedGuest?.participantId === p.id)

                if (!canEdit) {
                  return (
                    <li key={p.id} className="border-b border-border/50 py-2 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-[15px] truncate">{p.name}</span>
                        <span className="text-sm font-bold text-primary shrink-0">
                          {p.didNotPay ? 'No puso' : formatARS(p.amount)}
                        </span>
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={p.id}>
                    <PersonCard
                      person={person}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      embedded
                    />
                  </li>
                )
              })}
            </ul>
          )}

          {isHost && (
            <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={!canCalculate}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)*1.2)] border-0 bg-gradient-to-b from-primary to-primary-hover text-base font-bold text-primary-foreground shadow-[var(--shadow-btn)] disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Calculator className="size-[18px]" />
                Calcular reparto
              </button>
            </div>
          )}
        </section>

        {result && isHost && (
          <ResultsCard
            result={result}
            onShare={() => setShareOpen(true)}
            onReset={() => setResult(null)}
          />
        )}

        <Link href={isHost ? '/dashboard' : '/'} className="text-center text-[13px] text-muted-foreground hover:text-foreground">
          {isHost ? 'Volver a mis eventos' : 'Ir al inicio'}
        </Link>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} text={shareText} />
    </main>
  )
}
