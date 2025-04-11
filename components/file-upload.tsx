"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileContent: (content: string) => void
}

export default function FileUpload({ onFileContent }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const processContent = (content: string): string => {
    // Handle CSV format by converting to line-by-line format
    if (fileName.endsWith('.csv')) {
      const lines = content.split('\n');
      
      // Try to determine the separator (comma or semicolon)
      const firstLine = lines[0] || '';
      const separator = firstLine.includes(';') ? ';' : ',';
      
      return lines
        .map(line => {
          const parts = line.split(separator);
          // Assume format is either "Title,Artist" or "Artist,Title"
          if (parts.length >= 2) {
            // If the second part looks like an artist (no featuring, etc.), use "Title - Artist" format
            // Otherwise use "Artist - Title" format
            const part1 = parts[0].trim();
            const part2 = parts[1].trim();
            
            if (part2.toLowerCase().includes('feat') || part2.toLowerCase().includes('ft.')) {
              // This is likely a title with featuring artist
              return `${part1} - ${part2}`;
            } else {
              // Default format: Title - Artist
              return `${part1} - ${part2}`;
            }
          }
          return line;
        })
        .join('\n');
    }
    
    // Handle playlists with different formats
    return content
      .split('\n')
      .map(line => {
        // Clean up the line by removing excess whitespace, quotes, etc.
        let cleanLine = line.trim().replace(/^["']|["']$/g, '');
        
        // Skip empty lines
        if (!cleanLine) return '';
        
        // If line already contains " - ", keep it as is
        if (cleanLine.includes(' - ')) return cleanLine;
        
        // If it has a tab, replace with " - "
        if (cleanLine.includes('\t')) {
          return cleanLine.replace(/\t+/g, ' - ');
        }
        
        // If no separator, return as is (will be treated as search term)
        return cleanLine;
      })
      .filter(Boolean) // Remove empty lines
      .join('\n');
  };

  const handleFile = (file: File) => {
    setFileName(file.name)
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const processedContent = processContent(content)
      onFileContent(processedContent)
      setIsProcessing(false)
    }
    reader.readAsText(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-accent bg-accent/5" : "border-muted"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m16 16-4-4-4 4" />
        </svg>

        <div className="space-y-2">
          <p className="text-sm font-medium">{fileName ? `Selected: ${fileName}` : "Drag and drop your file here"}</p>
          <p className="text-xs text-muted-foreground">Supports TXT and CSV files with track names and artists</p>
        </div>

        <div>
          <label htmlFor="file-upload" className="cursor-pointer">
            <Button variant="outline" type="button" size="sm" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Browse Files"}
            </Button>
            <input id="file-upload" type="file" accept=".txt,.csv" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      </div>
    </div>
  )
}
