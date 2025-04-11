"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from "next/dynamic"

// Import Tesseract dynamically with no SSR
const TesseractJS = dynamic(() => import('tesseract.js'), { 
  ssr: false,
  loading: () => null
})

interface FileUploadProps {
  onFileContent: (content: string) => void
}

export default function FileUpload({ onFileContent }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tesseractLoaded, setTesseractLoaded] = useState(false)
  const [fileType, setFileType] = useState<string>("")

  useEffect(() => {
    // Check if Tesseract is available
    if (typeof window !== 'undefined') {
      const checkTesseract = async () => {
        try {
          await import('tesseract.js')
          setTesseractLoaded(true)
        } catch (err) {
          console.error("Failed to load Tesseract:", err)
        }
      }
      checkTesseract()
    }
  }, [])

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

  // Process extracted text from OCR
  const processExtractedText = (text: string): string => {
    // Split by lines and clean
    const lines = text.split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
    
    // Process each line to try to extract track and artist information
    return lines
      .map(line => {
        // Remove numbering that might be at the beginning (like "1. ")
        let processed = line.replace(/^\d+[.\s)]\s*/, '')
        
        // Check for common separators and replace with standardized format
        // Look for tabs, multiple spaces, bullet points, or other separators
        if (/\t|\s{3,}|•|\||-/.test(processed)) {
          processed = processed.replace(/\t+|\s{3,}|\s*•\s*|\s*\|\s*|\s*-\s*/, ' - ')
        }
        
        // Additional cleanup for OCR artifacts
        processed = processed
          .replace(/["""'']/g, '') // Remove quotes
          .replace(/\s+/g, ' ')     // Normalize spaces
        
        return processed
      })
      .filter(line => line.length > 1) // Remove very short lines
      .join('\n')
  }

  const processImageFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      if (!tesseractLoaded) {
        throw new Error("Text recognition engine not loaded yet. Please try again in a moment.")
      }

      // Create a URL for the image
      const imageUrl = URL.createObjectURL(file);
      
      try {
        // Use dynamic import for Tesseract
        const Tesseract = await import('tesseract.js');
        const worker = await Tesseract.createWorker('eng');
        const result = await worker.recognize(imageUrl);
        await worker.terminate();
        
        // Get the text from the result
        const extractedText = result.data.text;
        
        // Process the text
        const processedText = processExtractedText(extractedText);
        
        // Pass the processed text
        onFileContent(processedText);
      } finally {
        // Revoke the URL to free memory
        URL.revokeObjectURL(imageUrl);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name)
    setFileType(file.type)
    setIsProcessing(true)
    setError(null)

    // Check if it's an image file
    if (file.type.startsWith('image/')) {
      processImageFile(file);
      return;
    }

    // Otherwise, process as text file
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const processedContent = processContent(content)
        onFileContent(processedContent)
      } catch (err) {
        console.error('Error processing file:', err)
        setError('Failed to process file. Please check the format.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file')
      setIsProcessing(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              Supports TXT, CSV, and image files (JPG, PNG) with track names and artists
            </p>
          </div>

          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" type="button" size="sm" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Browse Files"}
              </Button>
              <input 
                id="file-upload" 
                type="file" 
                accept=".txt,.csv,image/jpeg,image/png,image/jpg" 
                className="hidden" 
                onChange={handleFileInput} 
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            {fileType.startsWith('image') ? 'Extracting text from image...' : 'Processing file...'}
          </p>
        </div>
      )}
    </div>
  )
}
