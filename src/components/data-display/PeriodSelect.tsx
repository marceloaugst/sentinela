import { Select } from '@/components/ui/input'
import { PERIODS, type PeriodKey } from '@/lib/periods'

export function PeriodSelect({ value, onChange, className }: { value: PeriodKey; onChange: (v: PeriodKey) => void; className?: string }) {
  return (
    <div className={className}>
      <Select aria-label="Período" value={value} onChange={(e) => onChange(e.target.value as PeriodKey)}>
        {PERIODS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
