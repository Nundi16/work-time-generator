export type LogDirection = 'IN' | 'OUT'

export interface RawLogEntry {
  employeeId: string
  timestamp: Date
  direction: LogDirection
}

export interface DailyWorkRecord {
  date: string
  arrival: string | null
  departure: string | null
  workedMinutes: number
  missingIn: boolean
  missingOut: boolean
  hasMultipleLogs: boolean
  manuallyEdited: boolean
}

export interface EmployeeMonthlyRecord {
  employeeId: string
  month: string
  dailyRecords: DailyWorkRecord[]
  totalMinutes: number
}

export interface ShiftDefaults {
  startTime: string
  endTime: string
}
