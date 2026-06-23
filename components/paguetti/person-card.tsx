'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatARS, formatAmountInput, parseAmountInput } from '@/lib/paguetti'
import type { Person } from '@/lib/paguetti'

interface PersonCardProps {
  person: Person
  onEdit: (updated: Person) => void
  onDelete: (id: string) => void
  embedded?: boolean
}

interface FormErrors {
  name?: string
  amount?: string
}

const INPUT_CLASS =
  'h-11 w-full min-w-0 rounded-[calc(var(--radius)*0.8)] border border-border/90 bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground dark:bg-card/80'

export function PersonCard({ person, onEdit, onDelete, embedded }: PersonCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAlias, setEditAlias] = useState('')
  const [editAmountDisplay, setEditAmountDisplay] = useState('')
  const [editErrors, setEditErrors] = useState<FormErrors>({})

  const openEdit = () => {
    setEditName(person.name)
    setEditAlias(person.alias)
    setEditAmountDisplay(
      person.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    )
    setEditErrors({})
    setEditOpen(true)
  }

  const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditAmountDisplay(formatAmountInput(e.target.value))
    if (editErrors.amount) setEditErrors((prev) => ({ ...prev, amount: undefined }))
  }

  const validateEdit = (): boolean => {
    const newErrors: FormErrors = {}
    if (!editName.trim()) newErrors.name = 'Sumá un nombre.'
    const parsed = parseAmountInput(editAmountDisplay)
    if (!editAmountDisplay.trim()) {
      newErrors.amount = 'Sumá cuánto pagó.'
    } else if (parsed === 0) {
      newErrors.amount = 'El monto tiene que ser mayor a $0.'
    }
    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateEdit()) return
    onEdit({
      ...person,
      name: editName.trim(),
      alias: editAlias.trim(),
      amount: parseAmountInput(editAmountDisplay),
    })
    setEditOpen(false)
  }

  return (
    <>
      <article
        className={cn(
          'flex items-center gap-2',
          embedded
            ? 'border-b border-border/50 py-2 last:border-b-0'
            : 'rounded-lg border border-border/70 bg-card px-2.5 py-2 transition-colors hover:bg-surface-elevated dark:border-border dark:bg-card/90'
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-[15px] text-foreground leading-tight truncate">
              {person.name}
            </span>
            <span className="text-sm font-bold text-primary shrink-0 tabular-nums">
              {formatARS(person.amount)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
            {person.alias ? (
              <>
                Alias:{' '}
                <span className="text-lime font-medium">{person.alias}</span>
              </>
            ) : (
              'Sin alias'
            )}
          </p>
        </div>

        <div className="flex items-center gap-0 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={openEdit}
            aria-label={`Editar a ${person.name}`}
            className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 p-0"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(person.id)}
            aria-label={`Eliminar a ${person.name}`}
            className="size-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-0"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </article>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-2xl bg-popover border-border p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-[15px] font-semibold text-foreground">
              Editar a {person.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[minmax(68px,76px)_1fr] gap-x-2.5 gap-y-1.5 items-start px-4 py-3">
            <label htmlFor="edit-name" className="pt-2.5 text-[13px] font-medium text-secondary-foreground">
              Nombre
            </label>
            <div className="flex flex-col gap-0.5 min-w-0">
              <input
                id="edit-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                  if (editErrors.name) setEditErrors((p) => ({ ...p, name: undefined }))
                }}
                placeholder="Ej: Juli"
                autoComplete="off"
                aria-invalid={!!editErrors.name}
                className={cn(INPUT_CLASS, editErrors.name && 'border-destructive')}
              />
              {editErrors.name && (
                <p role="alert" className="text-[11px] text-destructive">
                  {editErrors.name}
                </p>
              )}
            </div>

            <label htmlFor="edit-alias" className="pt-2.5 text-[13px] font-medium text-secondary-foreground">
              Alias
            </label>
            <input
              id="edit-alias"
              value={editAlias}
              onChange={(e) => setEditAlias(e.target.value)}
              placeholder="Ej: juli.mp"
              autoComplete="off"
              className={INPUT_CLASS}
            />

            <label htmlFor="edit-amount" className="pt-2.5 text-[13px] font-medium text-secondary-foreground">
              Monto
            </label>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="relative">
                <span
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none"
                  aria-hidden="true"
                >
                  $
                </span>
                <input
                  id="edit-amount"
                  value={editAmountDisplay}
                  onChange={handleEditAmountChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Ej: 18.500"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  aria-invalid={!!editErrors.amount}
                  className={cn(INPUT_CLASS, 'pl-6', editErrors.amount && 'border-destructive')}
                />
              </div>
              {editErrors.amount && (
                <p role="alert" className="text-[11px] text-destructive">
                  {editErrors.amount}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 px-4 pb-4">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="flex-1 h-10 border-border text-foreground hover:bg-muted text-sm"
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-0 bg-gradient-to-b from-primary to-primary-hover text-sm font-semibold text-primary-foreground shadow-[var(--shadow-btn)]"
            >
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
