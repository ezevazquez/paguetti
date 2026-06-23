'use client'

import { ArrowRight, Share2, Sparkles } from 'lucide-react'
import { formatARS } from '@/lib/paguetti'
import type { CalculationResult } from '@/lib/paguetti'

interface ResultsCardProps {
  result: CalculationResult
  onShare: () => void
}

export function ResultsCard({ result, onShare }: ResultsCardProps) {
  return (
    <section
      aria-label="Resultado del reparto"
      className="overflow-hidden rounded-[calc(var(--radius)*1.4)] border border-border/80 bg-card shadow-[var(--shadow-surface)] dark:border-border dark:shadow-none"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 border-b border-border/60">
        <Sparkles className="size-4 text-lime mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[13px] text-secondary-foreground leading-snug">
          Listo, estas son las transferencias más simples para quedar a mano.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-border/60">
        <StatCell label="Total" value={formatARS(result.total)} />
        <StatCell label="Personas" value={result.count.toString()} />
        <StatCell label="Cada uno" value={formatARS(result.share)} highlight />
      </div>

      {/* Transfers */}
      <div className="px-3.5 py-3 border-t border-border/60">
        {result.transfers.length === 0 ? (
          <p className="text-[13px] text-foreground leading-snug">
            Todos están al día. Nadie tiene que transferir nada.
          </p>
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {result.transfers.map((transfer, idx) => (
              <li
                key={idx}
                className="rounded-lg bg-background/60 dark:bg-background/30 px-2.5 py-2"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[13px] text-foreground">
                    {transfer.from}
                  </span>
                  <ArrowRight
                    className="size-3 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-[13px] text-foreground">
                    {transfer.to}
                  </span>
                  <span
                    className="ml-auto text-[13px] font-bold text-primary tabular-nums whitespace-nowrap"
                    aria-label={`importe ${formatARS(transfer.amount)}`}
                  >
                    {formatARS(transfer.amount)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {transfer.toAlias ? (
                    <>
                      Alias:{' '}
                      <span className="text-lime font-medium">{transfer.toAlias}</span>
                    </>
                  ) : (
                    <>{transfer.to} no cargó alias</>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Share */}
      <div className="px-3.5 pb-3.5">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground dark:border-border"
        >
          <Share2 className="size-4 shrink-0" aria-hidden="true" />
          Compartir resumen
        </button>
      </div>
    </section>
  )
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 px-1">
      <span className="text-[10px] text-muted-foreground text-center leading-tight uppercase tracking-wide">
        {label}
      </span>
      <span
        className={
          highlight
            ? 'text-[13px] font-bold text-lime text-center tabular-nums'
            : 'text-[13px] font-bold text-foreground text-center tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  )
}
