// ─── Types ────────────────────────────────────────────────────────────────────

export interface Person {
  id: string
  name: string
  alias: string
  amount: number // stored as integer pesos
  /** Participa en la división pero no aportó plata */
  didNotPay?: boolean
}

export interface Transfer {
  from: string
  fromAlias: string
  to: string
  toAlias: string
  amount: number
}

export interface CalculationResult {
  total: number
  count: number
  share: number
  transfers: Transfer[]
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format integer with dots as thousands separator (Argentine style).
 * E.g. 1250000 → "1.250.000"
 */
function formatThousands(n: number): string {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Format a number as Argentine pesos.
 * - Integers: $18.500
 * - With decimals (up to 2): $3.333,33
 */
export function formatARS(amount: number): string {
  const rounded = Math.round(amount * 100) / 100
  const abs = Math.abs(rounded)
  const intPart = Math.floor(abs)
  const decimalPart = Math.round((abs - intPart) * 100)
  const sign = rounded < 0 ? '-' : ''
  const intFormatted = formatThousands(intPart)

  if (decimalPart === 0) {
    return `${sign}$${intFormatted}`
  }

  const decStr = decimalPart.toString().padStart(2, '0')
  return `${sign}$${intFormatted},${decStr}`
}

/**
 * Parse a display amount string back to a raw number.
 * E.g. "18.500" → 18500
 */
export function parseAmountInput(displayValue: string): number {
  const digits = displayValue.replace(/\D/g, '')
  const num = parseInt(digits, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Format a digit-only string as thousands-separated display value.
 * E.g. "18500" → "18.500", "" → ""
 */
export function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculate the optimal transfers to settle debts with minimal moves.
 * Preserves decimal precision up to 2 decimal places in the output.
 */
export function calculateTransfers(people: Person[]): CalculationResult {
  const total = people.reduce((sum, p) => sum + p.amount, 0)
  const count = people.length
  const share = total / count

  // Build balance list (positive = owed money, negative = owes money)
  const balances = people.map((p) => ({
    ...p,
    balance: p.amount - share,
  }))

  // Sort: creditors (positive) descending, debtors (negative) ascending
  const creditors = balances
    .filter((p) => p.balance > 0.005)
    .sort((a, b) => b.balance - a.balance)
    .map((p) => ({ ...p }))

  const debtors = balances
    .filter((p) => p.balance < -0.005)
    .sort((a, b) => a.balance - b.balance)
    .map((p) => ({ ...p }))

  const transfers: Transfer[] = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance))
    const roundedAmount = Math.round(amount * 100) / 100

    if (roundedAmount > 0) {
      transfers.push({
        from: debtor.name,
        fromAlias: debtor.alias,
        to: creditor.name,
        toAlias: creditor.alias,
        amount: roundedAmount,
      })
    }

    creditor.balance -= amount
    debtor.balance += amount

    if (Math.abs(creditor.balance) < 0.005) i++
    if (Math.abs(debtor.balance) < 0.005) j++
  }

  return { total, count, share, transfers }
}

// ─── Share text ───────────────────────────────────────────────────────────────

/**
 * Build the plaintext summary to share via WhatsApp or clipboard.
 */
export function buildShareText(result: CalculationResult): string {
  const lines: string[] = []

  lines.push('🧾 Resumen de Paguetti')
  lines.push('')
  lines.push(`Total gastado: ${formatARS(result.total)}`)
  lines.push(`Personas: ${result.count}`)
  lines.push(`Cada uno pone: ${formatARS(result.share)}`)
  lines.push('')

  if (result.transfers.length === 0) {
    lines.push('Todos están al día. Nadie tiene que transferir nada.')
  } else {
    lines.push('Transferencias:')
    for (const t of result.transfers) {
      lines.push(`• ${t.from} le transfiere ${formatARS(t.amount)} a ${t.to}`)
      if (t.toAlias) {
        lines.push(`  Alias: ${t.toAlias}`)
      } else {
        lines.push(`  ${t.to} no cargó alias`)
      }
    }
  }

  return lines.join('\n')
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'paguetti-people'

export function loadPeople(): Person[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Person[]
  } catch {
    return []
  }
}

export function savePeople(people: Person[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
