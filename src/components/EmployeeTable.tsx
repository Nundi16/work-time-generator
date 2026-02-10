import { EmployeeMonthlyRecord, DailyWorkRecord } from '@/lib/types'
import { formatMinutesToHours, recalculateWorkedMinutes } from '@/lib/timeCalculations'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { WarningCircle, Info, PencilSimple, UserMinus, ArrowCounterClockwise } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'

interface EmployeeTableProps {
  record: EmployeeMonthlyRecord
  onRecordUpdate: (employeeId: string, dailyRecords: DailyWorkRecord[]) => void
  onDismiss: (employeeId: string) => void
  onUndismiss: (employeeId: string) => void
  index: number
}

export function EmployeeTable({ record, onRecordUpdate, onDismiss, onUndismiss, index }: EmployeeTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [showDismissDialog, setShowDismissDialog] = useState(false)

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

  const totalMinutes = record.dailyRecords.reduce((sum, day) => sum + day.workedMinutes, 0)

  const recordsWithData = record.dailyRecords.filter(day => day.arrival || day.departure)

  const handleDismissConfirm = () => {
    onDismiss(record.employeeId)
    setShowDismissDialog(false)
  }

  const handleUndismiss = () => {
    onUndismiss(record.employeeId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card className={record.isDismissed ? 'opacity-60 border-destructive/30' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Employee {record.employeeId}</CardTitle>
              {record.isDismissed && (
                <Badge variant="destructive" className="text-xs">
                  Dismissed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Total Hours
                </div>
                <div className="text-2xl font-semibold font-data text-accent">
                  {formatMinutesToHours(totalMinutes)}
                </div>
              </div>
              <div className="flex gap-2">
                {record.isDismissed ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUndismiss}
                    className="gap-2"
                  >
                    <ArrowCounterClockwise className="w-4 h-4" />
                    Restore
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setShowDismissDialog(true)}
                    className="gap-2"
                  >
                    <UserMinus className="w-4 h-4" />
                    Dismiss
                  </Button>
                )}
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
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Arrival
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Departure
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Hours
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
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
                        {new Date(day.date).toLocaleDateString('en-US', {
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
                              No IN
                            </Badge>
                          )}
                          {day.missingOut && (
                            <Badge variant="outline" className="text-xs border-warning text-warning">
                              <WarningCircle className="w-3 h-3 mr-1" />
                              No OUT
                            </Badge>
                          )}
                          {day.hasMultipleLogs && (
                            <Badge variant="outline" className="text-xs">
                              <Info className="w-3 h-3 mr-1" />
                              Multiple
                            </Badge>
                          )}
                          {day.manuallyEdited && (
                            <Badge variant="secondary" className="text-xs">
                              <PencilSimple className="w-3 h-3 mr-1" />
                              Edited
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
                    Monthly Total
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

      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Employee {record.employeeId}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the employee as dismissed. Their records will remain visible but grayed out. 
              You can restore them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismissConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Dismiss Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
