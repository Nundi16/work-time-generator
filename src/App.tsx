import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { RawLogEntry, EmployeeMonthlyRecord, ShiftDefaults, DailyWorkRecord } from './lib/types'
import { parseCSV, generateMonthlyRecords, exportToCSV } from './lib/timeCalculations'
import { FileUpload } from './components/FileUpload'
import { MonthSelector } from './components/MonthSelector'
import { EmployeeTable } from './components/EmployeeTable'
import { Button } from './components/ui/button'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Separator } from './components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog'
import { ArrowsClockwise, DownloadSimple, Printer, WarningCircle, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

function App() {
  const [logs, setLogs] = useKV<RawLogEntry[]>('access-logs', [])
  const [monthlyRecords, setMonthlyRecords] = useKV<EmployeeMonthlyRecord[]>('monthly-records', [])
  const [defaults, setDefaults] = useKV<ShiftDefaults>('shift-defaults', {
    startTime: '08:00',
    endTime: '17:00'
  })
  
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseWarnings, setParseWarnings] = useState<string[]>([])

  const handleFileUpload = (content: string) => {
    try {
      const result = parseCSV(content)
      setLogs(result.entries)
      setParseWarnings(result.warnings)
      
      if (result.skippedLines > 0) {
        toast.warning(`Loaded ${result.entries.length} entries, ${result.skippedLines} lines skipped`)
      } else {
        toast.success(`Loaded ${result.entries.length} log entries`)
      }
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to parse CSV file'
      setError(errorMsg)
      setParseWarnings([])
      toast.error(errorMsg)
    }
  }

  const handleGenerate = () => {
    if (!logs || logs.length === 0) {
      toast.error('Please upload a CSV file first')
      return
    }

    const currentRecords = monthlyRecords || []
    const hasExistingData = currentRecords.some(r => r.month === selectedMonth)
    if (hasExistingData) {
      setShowRegenerateDialog(true)
    } else {
      performGeneration()
    }
  }

  const performGeneration = () => {
    if (!logs) return
    
    const records = generateMonthlyRecords(logs, selectedMonth, defaults || { startTime: '08:00', endTime: '17:00' })
    
    setMonthlyRecords((current) => {
      const filtered = (current || []).filter(r => r.month !== selectedMonth)
      return [...filtered, ...records]
    })
    
    toast.success(`Generated records for ${records.length} employees`)
    setShowRegenerateDialog(false)
  }

  const handleRecordUpdate = (employeeId: string, dailyRecords: DailyWorkRecord[]) => {
    setMonthlyRecords((current) =>
      (current || []).map(record =>
        record.employeeId === employeeId && record.month === selectedMonth
          ? { ...record, dailyRecords }
          : record
      )
    )
  }

  const handleExport = () => {
    const recordsForMonth = (monthlyRecords || []).filter(r => r.month === selectedMonth)
    if (recordsForMonth.length === 0) {
      toast.error('No records to export')
      return
    }

    const csv = exportToCSV(recordsForMonth)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-time-${selectedMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported to CSV')
  }

  const handlePrint = () => {
    window.print()
  }

  const recordsForSelectedMonth = (monthlyRecords || []).filter(r => r.month === selectedMonth)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Work Time Generator
          </h1>
          <p className="text-muted-foreground">
            Transform access control logs into accurate monthly work time records
          </p>
        </header>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <WarningCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parseWarnings.length > 0 && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>File Processing Warnings</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  {parseWarnings.slice(0, 10).map((warning, idx) => (
                    <div key={idx}>• {warning}</div>
                  ))}
                  {parseWarnings.length > 10 && (
                    <div className="text-muted-foreground italic mt-2">
                      ...and {parseWarnings.length - 10} more warnings
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-4">1. Upload Access Logs</h2>
              <FileUpload onFileUpload={handleFileUpload} />
              {logs && logs.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ✓ Loaded {logs.length} log entries
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-medium mb-4">2. Select Month & Generate</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <MonthSelector
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  defaults={defaults || { startTime: '08:00', endTime: '17:00' }}
                  onDefaultsChange={setDefaults}
                />
                <Button onClick={handleGenerate} size="lg" className="gap-2">
                  <ArrowsClockwise className="w-5 h-5" />
                  Generate Monthly Table
                </Button>
              </div>
            </div>

            {recordsForSelectedMonth.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleExport} variant="outline" className="gap-2">
                    <DownloadSimple className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </>
            )}
          </div>

          {recordsForSelectedMonth.length === 0 && logs && logs.length > 0 && (
            <Alert>
              <AlertDescription>
                No records generated yet. Click "Generate Monthly Table" to create work time records.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {recordsForSelectedMonth.map((record, index) => (
              <EmployeeTable
                key={`${record.employeeId}-${record.month}`}
                record={record}
                onRecordUpdate={handleRecordUpdate}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Monthly Records?</DialogTitle>
            <DialogDescription>
              This will overwrite all existing records for {selectedMonth}, including any manual corrections
              you've made. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={performGeneration}>
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App