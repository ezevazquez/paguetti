'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CreateEventDialog } from '@/components/paguetti/create-event-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type EventSummary = {
  id: string
  slug: string
  title: string | null
  status: string
  participantCount: number
  createdAt: string
}

export function DashboardClient() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EventSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEvents(data.events)
    } catch {
      toast.error('No se pudieron cargar tus eventos.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${deleteTarget.slug}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo eliminar.')
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      toast.success('Evento eliminado.')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el evento.')
    } finally {
      setDeleting(false)
    }
  }

  const deleteLabel = deleteTarget?.title || (deleteTarget ? `Evento ${deleteTarget.slug}` : '')

  return (
    <main className="relative flex min-h-svh flex-col justify-center bg-background px-3.5 py-10">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
        <section className="rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card px-3.5 py-3 shadow-[var(--shadow-surface)]">
          <h2 className="mb-3 text-[13px] font-semibold text-foreground">Mis eventos</h2>

          {loading ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Cargando…</p>
          ) : events.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] leading-relaxed text-muted-foreground">
              Acá vas a ver tu lista de eventos. Creá un nuevo evento para comenzar
            </p>
          ) : (
            <ul className="flex flex-col gap-2" role="list">
              {events.map((event) => (
                <li key={event.id} className="flex items-stretch gap-1">
                  <Link
                    href={`/e/${event.slug}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-border/70 px-2.5 py-2 transition-colors hover:bg-surface-elevated/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-foreground">
                        {event.title || `Evento ${event.slug}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {event.participantCount} {event.participantCount === 1 ? 'persona' : 'personas'} · {event.status}
                      </p>
                    </div>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(event)}
                    aria-label={`Eliminar ${event.title || `evento ${event.slug}`}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border/70 px-2.5 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)*1.2)] border-0 bg-gradient-to-b from-primary to-primary-hover text-base font-bold text-primary-foreground shadow-[var(--shadow-btn)]"
        >
          <Plus className="size-[18px]" />
          Nuevo evento
        </button>

        <Link
          href="/"
          className="text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          Modo rápido
        </Link>
      </div>

      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent
          className="max-w-sm gap-5 rounded-2xl border-border/80 p-5 sm:p-6"
          showCloseButton={false}
        >
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-[15px] font-semibold text-foreground">
              ¿Eliminar evento?
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed">
              Se borra <span className="font-medium text-foreground">{deleteLabel}</span> y todos sus participantes. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mx-0 mb-0 flex flex-row gap-2.5 border-t-0 bg-transparent p-0 sm:justify-stretch">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="h-10 flex-1 border-border text-sm text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-0 bg-destructive text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
