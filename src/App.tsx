import { useState, useEffect } from 'react'
import { RawLogEntry, EmployeeMonthlyRecord, ShiftDefaults, DailyWorkRecord } from './lib/types'
import { parseCSV, generateMonthlyRecords } from './lib/timeCalculations'
import { 
  initDB, 
  saveLogs, 
  loadLogs, 
  saveMonthlyRecords, 
  loadMonthlyRecords,
  saveShiftDefaults,
  loadShiftDefaults,
  setEmployeeName,
  getAllEmployeeNames
} from './lib/db'
import { FileUpload } from './components/FileUpload'
import { MonthSelector } from './components/MonthSelector'
import { EmployeeTable } from './components/EmployeeTable'
import { PrintView } from './components/PrintView'
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
import { ArrowsClockwise, Printer, WarningCircle, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

function App() {
  const [logs, setLogs] = useState<RawLogEntry[]>([])
  const [monthlyRecords, setMonthlyRecords] = useState<EmployeeMonthlyRecord[]>([])
  const [defaults, setDefaults] = useState<ShiftDefaults>({
    startTime: '08:00',
    endTime: '17:00'
  })
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseWarnings, setParseWarnings] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB()
        
        const savedLogs = await loadLogs<RawLogEntry[]>()
        if (savedLogs) {
          const parsedLogs = savedLogs.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }))
          setLogs(parsedLogs)
        }

        const savedRecords = await loadMonthlyRecords<EmployeeMonthlyRecord[]>()
        if (savedRecords) {
          setMonthlyRecords(savedRecords)
        }

        const savedDefaults = await loadShiftDefaults<ShiftDefaults>()
        if (savedDefaults) {
          setDefaults(savedDefaults)
        }

        const names = await getAllEmployeeNames()
        setEmployeeNames(names)
      } catch (err) {
        console.error('Nem sikerült betölteni az adatokat az IndexedDB-ből:', err)
        toast.error('Nem sikerült betölteni a mentett adatokat')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (!isLoading && logs.length > 0) {
      saveLogs(logs).catch(err => console.error('Naplók mentése sikertelen:', err))
    }
  }, [logs, isLoading])

  useEffect(() => {
    if (!isLoading && monthlyRecords.length > 0) {
      saveMonthlyRecords(monthlyRecords).catch(err => console.error('Adatok mentése sikertelen:', err))
    }
  }, [monthlyRecords, isLoading])

  useEffect(() => {
    if (!isLoading) {
      saveShiftDefaults(defaults).catch(err => console.error('Alapértékek mentése sikertelen:', err))
    }
  }, [defaults, isLoading])

  const handleFileUpload = (content: string) => {
    try {
      const result = parseCSV(content)
      setLogs(result.entries)
      setParseWarnings(result.warnings)
      
      if (result.skippedLines > 0) {
        toast.warning(`${result.entries.length} bejegyzés betöltve, ${result.skippedLines} sor kihagyva`)
      } else {
        toast.success(`${result.entries.length} napló bejegyzés betöltve`)
      }
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'CSV fájl feldolgozása sikertelen'
      setError(errorMsg)
      setParseWarnings([])
      toast.error(errorMsg)
    }
  }

  const handleGenerate = () => {
    if (!logs || logs.length === 0) {
      toast.error('Először töltsön fel egy CSV fájlt')
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
    
    const recordsWithNames = records.map(record => ({
      ...record,
      employeeName: employeeNames[record.employeeId]
    }))
    
    setMonthlyRecords((current) => {
      const filtered = (current || []).filter(r => r.month !== selectedMonth)
      return [...filtered, ...recordsWithNames]
    })
    
    toast.success(`${records.length} dolgozó adatai generálva`)
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

  const handleNameChange = async (employeeId: string, name: string) => {
    try {
      await setEmployeeName(employeeId, name)
      const updatedNames = await getAllEmployeeNames()
      setEmployeeNames(updatedNames)
      
      setMonthlyRecords((current) =>
        current.map(record =>
          record.employeeId === employeeId
            ? { ...record, employeeName: name }
            : record
        )
      )
      
      toast.success(`Dolgozó neve frissítve`)
    } catch (err) {
      toast.error('Dolgozó nevének frissítése sikertelen')
      console.error(err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const recordsForSelectedMonth = (monthlyRecords || []).filter(r => r.month === selectedMonth)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Adatok betöltése...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl no-print">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Munkaidő Generátor
          </h1>
          <p className="text-muted-foreground">
            Beléptető rendszer naplóiból pontos havi munkaidő nyilvántartás készítése
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
              <AlertTitle>Fájl feldolgozási figyelmeztetések</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  {parseWarnings.slice(0, 10).map((warning, idx) => (
                    <div key={idx}>• {warning}</div>
                  ))}
                  {parseWarnings.length > 10 && (
                    <div className="text-muted-foreground italic mt-2">
                      ...és még {parseWarnings.length - 10} figyelmeztetés
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-4">1. Beléptető naplók feltöltése</h2>
              <FileUpload onFileUpload={handleFileUpload} />
              {logs && logs.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ✓ {logs.length} napló bejegyzés betöltve
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-medium mb-4">2. Hónap kiválasztása és generálás</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <MonthSelector
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  defaults={defaults || { startTime: '08:00', endTime: '17:00' }}
                  onDefaultsChange={setDefaults}
                />
                <Button onClick={handleGenerate} size="lg" className="gap-2">
                  <ArrowsClockwise className="w-5 h-5" />
                  Havi táblázat generálása
                </Button>
              </div>
            </div>

            {recordsForSelectedMonth.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handlePrint} variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Nyomtatás
                  </Button>
                </div>
              </>
            )}
          </div>

          {recordsForSelectedMonth.length === 0 && logs && logs.length > 0 && (
            <Alert>
              <AlertDescription>
                Még nincs generált adat. Kattintson a "Havi táblázat generálása" gombra a munkaidő nyilvántartás létrehozásához.
              </AlertDescription>
            </Alert>
          )}

          {recordsForSelectedMonth.length > 0 && (
            <div className="space-y-6">
              {recordsForSelectedMonth.map((record, index) => (
                <EmployeeTable
                  key={`${record.employeeId}-${record.month}`}
                  record={record}
                  onRecordUpdate={handleRecordUpdate}
                  onNameChange={handleNameChange}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PrintView records={recordsForSelectedMonth} month={selectedMonth} />

      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Újragenerálja a havi adatokat?</DialogTitle>
            <DialogDescription>
              Ez felülírja az összes meglévő adatot {selectedMonth} hónapra, beleértve az összes kézi módosítást is. 
              Ez a művelet nem vonható vissza.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
              Mégse
            </Button>
            <Button variant="destructive" onClick={performGeneration}>
              Újragenerálás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App