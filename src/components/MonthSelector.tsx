import { Calendar, Gear } from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { ShiftDefaults } from '@/lib/types'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  defaults: ShiftDefaults
  onDefaultsChange: (defaults: ShiftDefaults) => void
}

export function MonthSelector({ selectedMonth, onMonthChange, defaults, onDefaultsChange }: MonthSelectorProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = [
    { value: '01', label: 'Január' },
    { value: '02', label: 'Február' },
    { value: '03', label: 'Március' },
    { value: '04', label: 'Április' },
    { value: '05', label: 'Május' },
    { value: '06', label: 'Június' },
    { value: '07', label: 'Július' },
    { value: '08', label: 'Augusztus' },
    { value: '09', label: 'Szeptember' },
    { value: '10', label: 'Október' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const [year, month] = selectedMonth.split('-')

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <Select value={month} onValueChange={(m) => onMonthChange(`${year}-${m}`)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={(y) => onMonthChange(`${y}-${month}`)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Gear className="w-4 h-4 mr-2" />
            Alapértelmezett műszak
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Alapértelmezett műszak idők</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Hiányzó BE vagy KI naplók esetén használt
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="start-time">Kezdés ideje</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={defaults.startTime}
                  onChange={(e) => onDefaultsChange({ ...defaults, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Befejezés ideje</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={defaults.endTime}
                  onChange={(e) => onDefaultsChange({ ...defaults, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
