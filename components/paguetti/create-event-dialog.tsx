'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CreateEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setCreating(false)
    }
  }, [open])

  const handleCreate = async () => {
    const trimmed = title.trim().slice(0, 80)
    if (!trimmed) {
      toast.error('Poné un nombre para el evento.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'No se pudo crear el evento.')

      onOpenChange(false)
      router.push(`/e/${json.event.slug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el evento.')
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !creating && onOpenChange(next)}>
      <DialogContent
        className="max-w-sm gap-5 rounded-2xl border-border/80 p-5 sm:p-6"
        showCloseButton={false}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-[15px] font-semibold text-foreground">
            Nuevo evento
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Elegí un nombre para identificarlo en tu lista y compartirlo con el grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="event-title" className="text-[13px] text-foreground">
            Nombre del evento
          </Label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate()
            }}
            placeholder="Ej: Asado del sábado"
            disabled={creating}
            maxLength={80}
            autoFocus
            className="h-11 border-border/90 bg-background text-[15px]"
          />
        </div>

        <DialogFooter className="mx-0 mb-0 flex flex-row gap-2.5 border-t-0 bg-transparent p-0 sm:justify-stretch">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
            className="h-10 flex-1 border-border text-sm text-foreground hover:bg-muted"
          >
            Cancelar
          </Button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-0 bg-gradient-to-b from-primary to-primary-hover text-sm font-semibold text-primary-foreground shadow-[var(--shadow-btn)] disabled:opacity-50"
          >
            {creating ? 'Creando…' : 'Crear'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
