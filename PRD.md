# Work Time Generation Application

A professional time tracking application that transforms unreliable access control logs into accurate, editable monthly work time records for employees.


The app handles CSV parsing, table generation, inline editing, and export functionality with persistent state management, but maintains a focused
## Essential Features
### CSV Log Upload & Parsing

**Complexity Level**: Light Application (multiple features with basic state)
The app handles CSV parsing, table generation, inline editing, and export functionality with persistent state management, but maintains a focused single-view interface without complex navigation.

## Essential Features

### CSV Log Upload & Parsing
- **Functionality**: Parse tab-separated access control logs containing employee card swipes with fault-tolerant error handling
- **Purpose**: Convert raw access system data into normalized log entries for processing, gracefully handling malformed data
- **Trigger**: User clicks upload button and selects CSV/TSV file
- **Functionality**: Set global fallback times for missing IN/OUT logs
- **Trigger**: User opens settings panel

### CSV Export & Print
- **Purpose**: Share finalized work records with payroll systems or for archival
- **Progression**: Click export → Select format (CSV/Print) → Generate file/open print dialog → Download/pri

- **Functionality**: Assign human-readable names to employees identified by numeric IDs
- **Trigger**: User clicks on employee header to edit name

### Persistent Data Storag
- **Purpose**: Preserve user data between sessions without requiring manual saves or re-upload
- **Progression**: User makes change → Data automatically persisted to IndexedDB → On next visit, da


- **Missing IN log**: Apply default shift start time, flag row with warning indicator

- **Invalid CSV format**: Skip 
- **Functionality**: Set global fallback times for missing IN/OUT logs
- **Completely invalid file**: Show error if no valid entries found after 
- **Trigger**: User opens settings panel
- **Name editing**: Allow canceling name edit with Escape key, saving with Enter or checkmark
- **Data loading errors**: Show error message with option to continue without saved data

### CSV Export & Print

- **Purpose**: Share finalized work records with payroll systems or for archival

- **Secondary Colors**: 
  - Slate Blue (oklch(0.65 0.05 250)) for secondary actions and hover states

  - Primary Navy (okl


- **Missing IN log**: Apply default shift start time, flag row with warning indicator

  - H1 (Page Title): Inter Tight SemiBold/32px/tight letter-spacing (-0.02em)
  - H3 (Month Selector): Inter Tight Medium/18px/normal
  - Table Data (Times/Hours): Archivo Regular/15px/tabular-nums
  - Tiny (Helper Text): Inter Tight Regular/12px/uppercase letter-spacing (0.05em)
- **Invalid timestamps**: Skip rows with unparseable date/time values
Animations emphasize data state changes and guide user attention to c
- **Completely invalid file**: Show error if no valid entries found after parsing
- **Calculation updates**: Brief highlight flash (300ms) on daily/monthly tot
- **Export feedback**: Success checkmark animation and slide-down notificati

## Design Direction

  - **Button**: Primary action for generation, secondary for export, ghost variant for table actions

  - **Badge**: Sta

  

  - Badge variants for different warning types (info/warning/error)
  
  - Cool Gray (oklch(0.55 0.01 250)) for muted backgrounds and dividers
  - Inputs: Focused with accent border and subtle shadow, error with red bor
- **Icon Selection**:
  - Download/Export: DownloadSimple
  - Background White (oklch(0.98 0 0)): Navy text (oklch(0.25 0.08 250)) - Ratio 11.2:1 ✓
  - Manual edit flag: PencilSimple
  - Accent Teal (oklch(0.65 0.15 195)): Navy text (oklch(0.25 0.08 250)) - Ratio 4.7:1 ✓
  - Confirm: Check
  

## Font Selection

  

- **Typographic Hierarchy**:
  - Use drawer instead of dialog for settings


  - Body (Table Labels): Inter Tight Regular/14px/normal

  - Small (Warnings): Inter Tight Regular/13px/normal











- **Month navigation**: Crossfade transition between monthly views (250ms)

## Component Selection

- **Components**:

  - **Card**: Contains each employee's monthly table with header showing name and total hours

  - **Select**: Month picker with year + month combination

  - **Input**: Time input fields in editable table cells

  - **Alert**: Error messages for CSV parsing issues, empty states

  - **Separator**: Divides employees and sections visually

- **Customizations**:

  - Time inputs should use native time picker or custom time selection



- **States**:



  



  - Settings: Gear



  - Regenerate: ArrowsClockwise



  - Page padding: p-8

  - Card padding: p-6

  - Button padding: px-4 py-2 (default), px-6 py-3 (large)

  

  - Stack controls vertically instead of horizontal layout



  - Use drawer instead of dialog for settings

