'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmountInput, parseAmountInput } from '@/lib/paguetti'
import type { Person } from '@/lib/paguetti'

interface PersonFormProps {
  onAdd: (person: Omit<Person, 'id'>) => void
  focusTrigger?: number
}

interface FormErrors {
  name?: string
  amount?: string
}

export function PersonForm({ onAdd, focusTrigger }: PersonFormProps) {
  const [name, setName] = useState('')
  const [alias, setAlias] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [focusTrigger])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(formatAmountInput(e.target.value))
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!name.trim()) newErrors.name = 'Sumá un nombre.'
    const parsedAmount = parseAmountInput(amountDisplay)
    if (!amountDisplay.trim()) {
      newErrors.amount = 'Sumá cuánto pagó.'
    } else if (parsedAmount === 0) {
      newErrors.amount = 'El monto tiene que ser mayor a $0.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd({
      name: name.trim(),
      alias: alias.trim(),
      amount: parseAmountInput(amountDisplay),
    })
    setName('')
    setAlias('')
    setAmountDisplay('')
    setErrors({})
  }

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('pg-alias')?.focus()
    }
  }

  const handleAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('pg-amount')?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-muted-foreground text-center leading-snug">
        Sumá quién pagó y Paguetti hace las cuentas.
      </p>

      <div className="grid grid-cols-[minmax(68px,76px)_1fr] gap-x-2.5 gap-y-1.5 items-start">
        {/* Nombre */}
        <label htmlFor="pg-name" className="pt-2.5 text-[13px] font-medium text-secondary-foreground">
          Nombre
        </label>
        <div className="flex flex-col gap-0.5 min-w-0">
          <input
            id="pg-name"
            ref={nameRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            onKeyDown={handleNameKeyDown}
            placeholder="Ej: Juli"
            autoComplete="off"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'pg-name-error' : undefined}
            className={cn(
              'h-11 w-full rounded-[calc(var(--radius)*0.8)] border border-border/90 bg-background px-3 text-[15px] text-foreground transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-lime/35 dark:bg-card/80',
              errors.name && 'border-destructive'
            )}
          />
          {errors.name && (
            <p id="pg-name-error" role="alert" className="text-[11px] text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        {/* Alias */}
        <label htmlFor="pg-alias" className="pt-2.5 text-[13px] font-medium text-secondary-foreground">
          Alias
          <span className="block text-[10px] font-normal text-muted-foreground">opcional</span>
        </label>
        <input
          id="pg-alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          onKeyDown={handleAliasKeyDown}
          placeholder="Ej: juli.mp"
          autoComplete="off"
          className="h-11 w-full rounded-[calc(var(--radius)*0.8)] border border-border/90 bg-background px-3 text-[15px] text-foreground transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-lime/35 dark:bg-card/80"
        />

        {/* Monto */}
        <label htmlFor="pg-amount" className="pt-2.5 text-[13px] font-medium text-secondary-foreground">
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
              id="pg-amount"
              value={amountDisplay}
              onChange={handleAmountChange}
              onKeyDown={handleAmountKeyDown}
              placeholder="Ej: 18.500"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? 'pg-amount-error' : undefined}
              className={cn(
                'h-11 w-full rounded-[calc(var(--radius)*0.8)] border border-border/90 bg-background pl-6 pr-3 text-[15px] text-foreground transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-lime/35 dark:bg-card/80',
                errors.amount && 'border-destructive'
              )}
            />
          </div>
          {errors.amount && (
            <p id="pg-amount-error" role="alert" className="text-[11px] text-destructive">
              {errors.amount}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-0.5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-[15px] font-semibold text-foreground transition-colors hover:bg-muted/80 active:translate-y-px dark:bg-card/60 dark:hover:bg-muted/40"
      >
        <Plus className="size-4 shrink-0" aria-hidden="true" />
        Agregar
      </button>
    </div>
  )
}
