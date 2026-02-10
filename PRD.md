# Work Time Generation Application

A professional time tracking application that transforms unreliable access control logs into accurate, editable monthly work time records for employees.

**Experience Qualities**:
1. **Reliable** - Users trust the system to handle messy data intelligently, applying consistent business rules to generate accurate work records
2. **Transparent** - All data transformations are visible; users can see missing logs, fallback values, and manual corrections at a glance
3. **Efficient** - Monthly reports are generated instantly and can be corrected inline without switching contexts or losing work

**Complexity Level**: Light Application (multiple features with basic state)
The app handles CSV parsing, table generation, inline editing, and export functionality with persistent state management, but maintains a focused single-view interface without complex navigation.

## Essential Features

### CSV Log Upload & Parsing
- **Functionality**: Parse tab-separated access control logs containing employee card swipes with fault-tolerant error handling
- **Purpose**: Convert raw access system data into normalized log entries for processing, gracefully handling malformed data
- **Trigger**: User clicks upload button and selects CSV/TSV file
- **Progression**: Select file → Parse rows → Skip invalid lines → Collect warnings → Show success notification with skip count → Display detailed warnings → Enable generation button
- **Success criteria**: Valid rows parsed successfully, invalid rows skipped with detailed warnings showing line numbers and specific errors (invalid format, missing fields, invalid timestamps, invalid direction codes)

### Monthly Table Generation
- **Functionality**: Generate structured daily work records for all employees in selected month
- **Purpose**: Transform raw logs into business-meaningful work time data using earliest IN/latest OUT logic
- **Trigger**: User selects month and clicks "Generate" button
- **Progression**: Select month → Click generate → Apply business rules (earliest IN, latest OUT, default fallbacks) → Display editable table per employee → Show warnings for missing logs
- **Success criteria**: Each employee has complete daily breakdown with arrival, departure, worked hours, and anomaly flags

### Manual Time Correction
- **Functionality**: Edit arrival/departure times with automatic recalculation of worked hours
- **Purpose**: Allow HR to correct missing or incorrect logs while maintaining calculation integrity
- **Trigger**: User clicks on arrival or departure time cell
- **Progression**: Click cell → Time picker appears → Select new time → Auto-recalculate daily/monthly totals → Mark row as manually edited
- **Success criteria**: Edits save immediately, calculated fields update automatically, manual edit indicator visible

### Default Shift Configuration
- **Functionality**: Set global fallback times for missing IN/OUT logs
- **Purpose**: Provide reasonable defaults when access logs are incomplete
- **Trigger**: User opens settings panel
- **Progression**: Click settings → Input default start/end times → Save → Apply to future generations
- **Success criteria**: Defaults apply to all employees when logs are missing, clearly indicated in table

### CSV Export & Print
- **Functionality**: Export final corrected monthly tables as CSV or print-friendly format
- **Purpose**: Share finalized work records with payroll systems or for archival
- **Trigger**: User clicks export/print button
- **Progression**: Click export → Select format (CSV/Print) → Generate file/open print dialog → Download/print
- **Success criteria**: Exported data matches displayed table including manual corrections

### Employee Naming
- **Functionality**: Assign human-readable names to employees identified by numeric IDs
- **Purpose**: Make work records more readable and professional by displaying employee names instead of just IDs
- **Trigger**: User clicks on employee header to edit name
- **Progression**: Click employee name/ID → Inline input appears → Enter name → Press Enter or click checkmark to save → Name persists and displays on employee card
- **Success criteria**: Employee names persist across sessions, display prominently in headers, fallback to ID when no name set

### Persistent Data Storage
- **Functionality**: Store all uploaded logs, generated records, settings, and employee names in IndexedDB
- **Purpose**: Preserve user data between sessions without requiring manual saves or re-uploads
- **Trigger**: Automatic on any data change (upload, generation, edit, naming, settings)
- **Progression**: User makes change → Data automatically persisted to IndexedDB → On next visit, data loads from IndexedDB → User continues where they left off
- **Success criteria**: All data survives page refresh and browser restart, loading state displays while data loads, errors handled gracefully

## Edge Case Handling

- **Multiple scans per day**: Use only earliest IN and latest OUT, ignore intermediate logs
- **Missing IN log**: Apply default shift start time, flag row with warning indicator
- **Missing OUT log**: Apply default shift end time, flag row with warning indicator
- **Both IN/OUT missing**: Use full default shift hours, flag with strong warning
- **Regeneration with edits**: Show clear warning dialog that manual corrections will be lost
- **Invalid CSV format**: Skip malformed rows and continue processing, display detailed warnings with line numbers
- **Invalid direction codes**: Skip rows with unrecognized direction codes (only 0=IN and 1=OUT are valid)
- **Invalid timestamps**: Skip rows with unparseable date/time values
- **Missing employee IDs**: Skip rows without employee identification
- **Completely invalid file**: Show error if no valid entries found after parsing
- **Empty month**: Show empty state with helpful message to upload logs first
- **Cross-midnight shifts**: Handle shifts that span past midnight correctly
- **Unnamed employees**: Display employee ID as fallback when no name assigned
- **Name editing**: Allow canceling name edit with Escape key, saving with Enter or checkmark
- **IndexedDB unavailable**: Graceful fallback with warning that data won't persist
- **Data loading errors**: Show error message with option to continue without saved data
- **Large datasets**: IndexedDB handles thousands of log entries without performance degradation

## Design Direction

The design should evoke **precision, clarity, and professional authority**. This is a business tool used by HR and operations staff who need confidence in data accuracy. The interface should feel like a well-organized spreadsheet meets a modern dashboard—structured but not clinical, data-dense but scannable. Visual hierarchy should guide users through the monthly view efficiently, with warnings and anomalies standing out immediately without being alarming.

## Color Selection

A professional, trustworthy palette with clear semantic colors for data states.

- **Primary Color**: Deep Navy Blue (oklch(0.35 0.08 250)) - Conveys reliability, professionalism, and authority appropriate for enterprise time tracking
- **Secondary Colors**: 
  - Cool Gray (oklch(0.55 0.01 250)) for muted backgrounds and dividers
  - Slate Blue (oklch(0.65 0.05 250)) for secondary actions and hover states
- **Accent Color**: Vibrant Teal (oklch(0.65 0.15 195)) - Fresh, professional accent for primary actions and active states
- **Foreground/Background Pairings**:
  - Background White (oklch(0.98 0 0)): Navy text (oklch(0.25 0.08 250)) - Ratio 11.2:1 ✓
  - Primary Navy (oklch(0.35 0.08 250)): White text (oklch(0.98 0 0)) - Ratio 8.5:1 ✓
  - Accent Teal (oklch(0.65 0.15 195)): Navy text (oklch(0.25 0.08 250)) - Ratio 4.7:1 ✓
  - Warning Amber (oklch(0.75 0.15 75)): Navy text (oklch(0.25 0.08 250)) - Ratio 5.2:1 ✓
  - Error Red (oklch(0.60 0.22 25)): White text (oklch(0.98 0 0)) - Ratio 4.9:1 ✓

## Font Selection

A combination that balances data readability with professional presentation, using Archivo for its tabular excellence and clear numerals alongside Inter Tight for UI elements.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter Tight SemiBold/32px/tight letter-spacing (-0.02em)
  - H2 (Employee Names): Inter Tight Medium/24px/normal
  - H3 (Month Selector): Inter Tight Medium/18px/normal
  - Body (Table Labels): Inter Tight Regular/14px/normal
  - Table Data (Times/Hours): Archivo Regular/15px/tabular-nums
  - Small (Warnings): Inter Tight Regular/13px/normal
  - Tiny (Helper Text): Inter Tight Regular/12px/uppercase letter-spacing (0.05em)

## Animations

Animations emphasize data state changes and guide user attention to calculation updates and validation feedback.

- **Table generation**: Subtle fade-in with stagger effect for employee rows (100ms delay between rows)
- **Cell editing**: Smooth highlight pulse when entering edit mode, scale-in for time picker
- **Calculation updates**: Brief highlight flash (300ms) on daily/monthly total cells when recalculated
- **Warning indicators**: Gentle attention-seeking pulse on initial render, settling to static state
- **Export feedback**: Success checkmark animation and slide-down notification
- **Month navigation**: Crossfade transition between monthly views (250ms)

## Component Selection

- **Components**:
  - **Table**: Custom table component with editable cells using Input components inline
  - **Card**: Contains each employee's monthly table with header showing name and total hours
  - **Button**: Primary action for generation, secondary for export, ghost variant for table actions
  - **Select**: Month picker with year + month combination
  - **Dialog**: Warning confirmation before regeneration, settings configuration
  - **Input**: Time input fields in editable table cells
  - **Badge**: Status indicators for warnings (missing IN/OUT, manual edit flags)
  - **Alert**: Error messages for CSV parsing issues, empty states
  - **Popover**: Settings panel for default shift times
  - **Separator**: Divides employees and sections visually
  
- **Customizations**:
  - Table cells need hover states and click-to-edit behavior
  - Time inputs should use native time picker or custom time selection
  - Badge variants for different warning types (info/warning/error)
  - File upload dropzone with drag-and-drop support
  
- **States**:
  - Buttons: Default/hover with slight scale and brightness increase, active with inset shadow, disabled with reduced opacity
  - Table cells: Default/hover with background tint, editing with border highlight and shadow, error with red left border
  - Inputs: Focused with accent border and subtle shadow, error with red border
  
- **Icon Selection**:
  - Upload: UploadSimple
  - Download/Export: DownloadSimple
  - Settings: Gear
  - Warning indicators: WarningCircle, Info
  - Calendar/Month: Calendar
  - Manual edit flag: PencilSimple
  - Regenerate: ArrowsClockwise
  - Print: Printer
  - Edit name: PencilSimple
  - Confirm: Check
  - Cancel: X
  
- **Spacing**:
  - Page padding: p-8
  - Section gaps: gap-6
  - Card padding: p-6
  - Table cells: px-4 py-2
  - Button padding: px-4 py-2 (default), px-6 py-3 (large)
  - Component groups: gap-4
  
- **Mobile**:
  - Stack controls vertically instead of horizontal layout
  - Make tables horizontally scrollable with sticky first column (employee name)
  - Collapse employee cards into accordion-style expandable sections
  - Reduce padding to p-4 on mobile
  - Use drawer instead of dialog for settings
  - Show simplified month selector (month only, easier touch targets)
