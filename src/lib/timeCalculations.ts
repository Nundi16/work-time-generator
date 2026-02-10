import { RawLogEntry, DailyWorkRecord, EmployeeMonthlyRecord, ShiftDefaults } from './types'

export function parseCSV(csvContent: string): RawLogEntry[] {
  const lines = csvContent.trim().split('\n')
  const entries: RawLogEntry[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = line.split('\t')
    if (fields.length < 4) {
      throw new Error(`Invalid format at line ${i + 1}: expected at least 4 fields`)
    }

    const employeeId = fields[0].trim()
    const timestamp = new Date(fields[1].trim())
    const directionCode = fields[3].trim()

    if (isNaN(timestamp.getTime())) {
      throw new Error(`Invalid timestamp at line ${i + 1}: ${fields[1]}`)
    }

    const direction = directionCode === '0' ? 'IN' : directionCode === '1' ? 'OUT' : null
    if (!direction) {
      throw new Error(`Invalid direction code at line ${i + 1}: ${directionCode}`)
    }

    entries.push({
      employeeId,
      timestamp,
      direction
    })
  }

  return entries
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

export function exportToCSV(records: EmployeeMonthlyRecord[]): string {
  let csv = 'Employee ID,Date,Arrival,Departure,Worked Hours,Warnings\n'

  for (const employee of records) {
    for (const day of employee.dailyRecords) {
      if (!day.arrival && !day.departure) continue

      const warnings: string[] = []
      if (day.missingIn) warnings.push('Missing IN')
      if (day.missingOut) warnings.push('Missing OUT')
      if (day.hasMultipleLogs) warnings.push('Multiple logs')
      if (day.manuallyEdited) warnings.push('Manually edited')

      csv += `${employee.employeeId},${day.date},${day.arrival || ''},${day.departure || ''},${formatMinutesToHours(day.workedMinutes)},${warnings.join('; ')}\n`
    }

    csv += `${employee.employeeId},TOTAL,,,${formatMinutesToHours(employee.totalMinutes)},\n\n`
  }

  return csv
}
