import { RawLogEntry, DailyWorkRecord, EmployeeMonthlyRecord, ShiftDefaults } from './types'

export interface ParseResult {
  entries: RawLogEntry[]
  skippedLines: number
  warnings: string[]
}

export function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n')
  const entries: RawLogEntry[] = []
  const warnings: string[] = []
  let skippedLines = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = line.split('\t')
    if (fields.length < 4) {
      warnings.push(`Line ${i + 1}: Invalid format (expected at least 4 fields) - skipped`)
      skippedLines++
      continue
    }

    const employeeId = fields[0].trim()
    const timestampStr = fields[1].trim()
    const directionCode = fields[3].trim()

    if (!employeeId) {
      warnings.push(`Line ${i + 1}: Missing employee ID - skipped`)
      skippedLines++
      continue
    }

    const timestamp = new Date(timestampStr)
    if (isNaN(timestamp.getTime())) {
      warnings.push(`Line ${i + 1}: Invalid timestamp "${timestampStr}" - skipped`)
      skippedLines++
      continue
    }

    const direction = directionCode === '0' ? 'IN' : directionCode === '1' ? 'OUT' : null
    if (!direction) {
      warnings.push(`Line ${i + 1}: Invalid direction code "${directionCode}" - skipped`)
      skippedLines++
      continue
    }

    entries.push({
      employeeId,
      timestamp,
      direction
    })
  }

  if (entries.length === 0 && lines.length > 0) {
    throw new Error('No valid entries found in the file')
  }

  return { entries, skippedLines, warnings }
}

export function generateMonthlyRecords(
  logs: RawLogEntry[],
  month: string,
  defaults: ShiftDefaults
): EmployeeMonthlyRecord[] {
  const [year, monthNum] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNum, 0).getDate()

  const employeeGroups = new Map<string, RawLogEntry[]>()
  
  for (const log of logs) {
    const logMonth = `${log.timestamp.getFullYear()}-${String(log.timestamp.getMonth() + 1).padStart(2, '0')}`
    if (logMonth !== month) continue

    if (!employeeGroups.has(log.employeeId)) {
      employeeGroups.set(log.employeeId, [])
    }
    employeeGroups.get(log.employeeId)!.push(log)
  }

  const records: EmployeeMonthlyRecord[] = []

  for (const [employeeId, employeeLogs] of employeeGroups) {
    const dailyRecords: DailyWorkRecord[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayLogs = employeeLogs.filter(log => {
        const logDate = `${log.timestamp.getFullYear()}-${String(log.timestamp.getMonth() + 1).padStart(2, '0')}-${String(log.timestamp.getDate()).padStart(2, '0')}`
        return logDate === dateStr
      })

      const inLogs = dayLogs.filter(l => l.direction === 'IN')
      const outLogs = dayLogs.filter(l => l.direction === 'OUT')

      const hasMultipleLogs = inLogs.length > 1 || outLogs.length > 1
      const missingIn = inLogs.length === 0 && outLogs.length > 0
      const missingOut = outLogs.length === 0 && inLogs.length > 0

      let arrival: string | null = null
      let departure: string | null = null

      if (inLogs.length > 0) {
        const earliestIn = inLogs.reduce((earliest, log) => 
          log.timestamp < earliest.timestamp ? log : earliest
        )
        arrival = formatTime(earliestIn.timestamp)
      } else if (outLogs.length > 0) {
        arrival = defaults.startTime
      }

      if (outLogs.length > 0) {
        const latestOut = outLogs.reduce((latest, log) => 
          log.timestamp > latest.timestamp ? log : latest
        )
        departure = formatTime(latestOut.timestamp)
      } else if (inLogs.length > 0) {
        departure = defaults.endTime
      }

      const workedMinutes = calculateWorkedMinutes(arrival, departure, dateStr)

      dailyRecords.push({
        date: dateStr,
        arrival,
        departure,
        workedMinutes,
        missingIn,
        missingOut,
        hasMultipleLogs,
        manuallyEdited: false
      })
    }

    const totalMinutes = dailyRecords.reduce((sum, record) => sum + record.workedMinutes, 0)

    records.push({
      employeeId,
      month,
      dailyRecords,
      totalMinutes
    })
  }

  return records.sort((a, b) => a.employeeId.localeCompare(b.employeeId))
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function calculateWorkedMinutes(arrival: string | null, departure: string | null, date: string): number {
  if (!arrival || !departure) return 0

  const [arrHour, arrMin] = arrival.split(':').map(Number)
  const [depHour, depMin] = departure.split(':').map(Number)

  const arrDate = new Date(`${date}T${arrival}:00`)
  let depDate = new Date(`${date}T${departure}:00`)

  if (depHour < arrHour || (depHour === arrHour && depMin < arrMin)) {
    depDate = new Date(depDate.getTime() + 24 * 60 * 60 * 1000)
  }

  return Math.round((depDate.getTime() - arrDate.getTime()) / (1000 * 60))
}

export function recalculateWorkedMinutes(record: DailyWorkRecord): number {
  return calculateWorkedMinutes(record.arrival, record.departure, record.date)
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${String(mins).padStart(2, '0')}`
}
