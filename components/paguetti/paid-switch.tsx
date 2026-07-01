'use client'

import { Switch } from '@/components/ui/switch'

interface PaidSwitchProps {
  paid: boolean
  onPaidChange: (paid: boolean) => void
}

export function PaidSwitch({ paid, onPaidChange }: PaidSwitchProps) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <Switch
        checked={paid}
        onCheckedChange={onPaidChange}
        aria-label={paid ? 'Puso' : 'No puso'}
      />
      <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap leading-none">
        {paid ? 'Puso 💵' : 'No puso 💸'}
      </span>
    </div>
  )
}
