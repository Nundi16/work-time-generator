import { EmployeeMonthlyRecord } from '@/lib/types'
import { formatMinutesToHours } from '@/lib/timeCalculations'

interface PrintViewProps {
  records: EmployeeMonthlyRecord[]
  month: string
}

export function PrintView({ records, month }: PrintViewProps) {
  const monthDate = new Date(month + '-01')
  const monthName = monthDate.toLocaleDateString('hu-HU', { month: 'long', year: 'numeric' })

  return (
    <div className="hidden print:block">
      {records.map((record, index) => {
        const totalMinutes = record.dailyRecords.reduce((sum, day) => sum + day.workedMinutes, 0)
        const recordsWithData = record.dailyRecords.filter(day => day.arrival || day.departure)

        return (
          <div key={record.employeeId} className={index < records.length - 1 ? 'print-page-break' : ''}>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-1">
                {record.employeeName || `Dolgozó ${record.employeeId}`}
              </h1>
              <p className="text-sm text-gray-600">{monthName}</p>
            </div>

            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 px-2 text-sm font-semibold">Dátum</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Nap</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Érkezés</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Távozás</th>
                  <th className="text-right py-2 px-2 text-sm font-semibold">Órák</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Megjegyzések</th>
                </tr>
              </thead>
              <tbody>
                {recordsWithData.map((day) => {
                  const date = new Date(day.date)
                  const dayName = date.toLocaleDateString('hu-HU', { weekday: 'short' })
                  const dateNum = date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
                  
                  const notes: string[] = []
                  if (day.missingIn) notes.push('Nincs BE')
                  if (day.missingOut) notes.push('Nincs KI')
                  if (day.hasMultipleLogs) notes.push('Többszörös napló')
                  if (day.manuallyEdited) notes.push('Szerkesztett')

                  return (
                    <tr key={day.date} className="border-b border-gray-300">
                      <td className="py-1.5 px-2 text-sm">{dateNum}</td>
                      <td className="py-1.5 px-2 text-sm">{dayName}</td>
                      <td className="py-1.5 px-2 text-sm font-mono">
                        {day.arrival || '—'}
                      </td>
                      <td className="py-1.5 px-2 text-sm font-mono">
                        {day.departure || '—'}
                      </td>
                      <td className="py-1.5 px-2 text-sm text-right font-mono">
                        {formatMinutesToHours(day.workedMinutes)}
                      </td>
                      <td className="py-1.5 px-2 text-xs text-gray-600">
                        {notes.join(', ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-semibold">
                  <td colSpan={4} className="py-2 px-2 text-sm">Összes óra:</td>
                  <td className="py-2 px-2 text-sm text-right font-mono">
                    {formatMinutesToHours(totalMinutes)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <div className="text-xs text-gray-500 mt-6">
              <p>Generálva: {new Date().toLocaleDateString('hu-HU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
