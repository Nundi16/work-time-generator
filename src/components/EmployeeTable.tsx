import { EmployeeMonthlyRecord, DailyWorkRecord } from '@/lib/types'
import { formatMinutesToHours, recalculateWorkedMinutes } from '@/lib/timeCalculations'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { WarningCircle, Info, PencilSimple, Check, X } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface EmployeeTableProps {
  record: EmployeeMonthlyRecord
  onRecordUpdate: (employeeId: string, dailyRecords: DailyWorkRecord[]) => void
  onNameChange: (employeeId: string, name: string) => void
  index: number
}

export function EmployeeTable({ record, onRecordUpdate, onNameChange, index }: EmployeeTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(record.employeeName || '')

  const handleTimeEdit = (dayIndex: number, field: 'arrival' | 'departure', value: string) => {
    const updatedRecords = [...record.dailyRecords]
    updatedRecords[dayIndex] = {
      ...updatedRecords[dayIndex],
      [field]: value,
      manuallyEdited: true
    }
    updatedRecords[dayIndex].workedMinutes = recalculateWorkedMinutes(updatedRecords[dayIndex])
    onRecordUpdate(record.employeeId, updatedRecords)
    setEditingCell(null)
  }

  const handleNameSave = () => {
    if (nameInput.trim()) {
      onNameChange(record.employeeId, nameInput.trim())
    }
    setEditingName(false)
  }

  const handleNameCancel = () => {
    setNameInput(record.employeeName || '')
    setEditingName(false)
  }

  const totalMinutes = record.dailyRecords.reduce((sum, day) => sum + day.workedMinutes, 0)

  const recordsWithData = record.dailyRecords.filter(day => day.arrival || day.departure)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Dolgozó neve"
                    className="w-64"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave()
                      if (e.key === 'Escape') handleNameCancel()
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={handleNameSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleNameCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-2 hover:bg-muted/30 px-3 py-1 rounded transition-colors group"
                >
                  <CardTitle className="text-xl">
                    {record.employeeName || `Dolgozó ${record.employeeId}`}
                  </CardTitle>
                  <PencilSimple className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              {!record.employeeName && !editingName && (
                <Badge variant="outline" className="text-xs">
                  ID: {record.employeeId}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Összes óra
              </div>
              <div className="text-2xl font-semibold font-data text-accent">
                {formatMinutesToHours(totalMinutes)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Dátum
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Érkezés
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Távozás
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Órák
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Státusz
                  </th>
                </tr>
              </thead>
              <tbody>
                {recordsWithData.map((day, dayIndex) => {
                  const actualDayIndex = record.dailyRecords.indexOf(day)
                  const cellId = (field: string) => `${record.employeeId}-${actualDayIndex}-${field}`
                  
                  return (
                    <tr
                      key={day.date}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 px-4 font-data text-sm">
                        {new Date(day.date).toLocaleDateString('hu-HU', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </td>
                      <td className="py-2 px-4">
                        {editingCell === cellId('arrival') ? (
                          <Input
                            type="time"
                            value={day.arrival || ''}
                            onChange={(e) => handleTimeEdit(actualDayIndex, 'arrival', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="w-32 h-8 font-data"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCell(cellId('arrival'))}
                            className={`font-data text-sm hover:bg-accent/10 px-2 py-1 rounded transition-colors ${
                              day.missingIn ? 'text-warning' : ''
                            }`}
                          >
                            {day.arrival || '—'}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {editingCell === cellId('departure') ? (
                          <Input
                            type="time"
                            value={day.departure || ''}
                            onChange={(e) => handleTimeEdit(actualDayIndex, 'departure', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="w-32 h-8 font-data"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCell(cellId('departure'))}
                            className={`font-data text-sm hover:bg-accent/10 px-2 py-1 rounded transition-colors ${
                              day.missingOut ? 'text-warning' : ''
                            }`}
                          >
                            {day.departure || '—'}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <motion.span
                          key={day.workedMinutes}
                          initial={{ backgroundColor: 'rgba(101, 163, 13, 0.1)' }}
                          animate={{ backgroundColor: 'rgba(101, 163, 13, 0)' }}
                          transition={{ duration: 0.3 }}
                          className="font-data text-sm inline-block px-2 py-1 rounded"
                        >
                          {formatMinutesToHours(day.workedMinutes)}
                        </motion.span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {day.missingIn && (
                            <Badge variant="outline" className="text-xs border-warning text-warning">
                              <WarningCircle className="w-3 h-3 mr-1" />
                              Nincs BE
                            </Badge>
                          )}
                          {day.missingOut && (
                            <Badge variant="outline" className="text-xs border-warning text-warning">
                              <WarningCircle className="w-3 h-3 mr-1" />
                              Nincs KI
                            </Badge>
                          )}
                          {day.hasMultipleLogs && (
                            <Badge variant="outline" className="text-xs">
                              <Info className="w-3 h-3 mr-1" />
                              Többszörös
                            </Badge>
                          )}
                          {day.manuallyEdited && (
                            <Badge variant="secondary" className="text-xs">
                              <PencilSimple className="w-3 h-3 mr-1" />
                              Szerkesztett
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-3 px-4 text-sm" colSpan={3}>
                    Havi összesítés
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-data text-base text-accent">
                      {formatMinutesToHours(totalMinutes)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
