import { UploadSimple } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { useState, useRef } from 'react'

interface FileUploadProps {
  onFileUpload: (content: string) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileUpload(content)
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt,.dat"
        onChange={handleFileChange}
        className="hidden"
      />
      <UploadSimple className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-sm font-medium mb-1">
        Húzza ide a fájlt vagy kattintson a feltöltéshez
      </p>
      <p className="text-xs text-muted-foreground">
        Tabulátorral elválasztott beléptető napló (.csv, .tsv, .txt, .dat)
      </p>
    </div>
  )
}
