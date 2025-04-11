"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from "next/dynamic"
import { useTextCleaner } from "@/hooks/use-text-cleaner"
import SongSelection from "@/components/song-selection"
import { useRouter } from 'next/navigation'

// Type declaration for Tesseract.js
declare module 'tesseract.js' {
  interface RecognizeResult {
    data: {
      text: string;
      hocr?: string | undefined;
      tsv?: string | undefined; 
      box?: string | undefined;
      unlv?: string | undefined;
      osd?: string | undefined;
      confidence: number;
      lines: any[];
      blocks: any[];
      paragraphs: any[];
      words: any[];
      symbols: any[];
    }
  }
  
  export function createWorker(options?: {
    logger?: (msg: any) => void;
    langPath?: string;
    gzip?: boolean;
    corePath?: string;
    workerPath?: string;
    cachePath?: string;
    dataPath?: string;
  }): Promise<{
    load: () => Promise<void>;
    loadLanguage: (lang: string) => Promise<void>;
    initialize: (lang: string) => Promise<void>;
    recognize: (image: string | HTMLImageElement | HTMLCanvasElement) => Promise<RecognizeResult>;
    terminate: () => Promise<void>;
  }>;
}

// Import Tesseract dynamically with no SSR
const TesseractJS = dynamic(() => import('tesseract.js'), { 
  ssr: false,
  loading: () => null
});

// Add JSX namespace for React 18 compatibility
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface FileUploadProps {
  onFileContent: (content: string) => void;
}

export default function FileUpload({ onFileContent }: FileUploadProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tesseractLoaded, setTesseractLoaded] = useState(false);
  const [fileType, setFileType] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [extractedContent, setExtractedContent] = useState<string>("");
  const [isCleaningWithAI, setIsCleaningWithAI] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [showSongSelection, setShowSongSelection] = useState(false);
  const [extractedSongs, setExtractedSongs] = useState<string[]>([]);
  
  // Get the text cleaner hook
  const { cleanText, isLoading: isAILoading } = useTextCleaner();

  // Create a file input reference that we can use to programmatically click on the input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if Tesseract is available
    if (typeof window !== 'undefined') {
      const checkTesseract = async () => {
        try {
          // Just test importing, don't initialize yet
          await import('tesseract.js');
          setTesseractLoaded(true);
        } catch (err) {
          console.error("Failed to load Tesseract:", err);
        }
      };
      checkTesseract();
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

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
        
        // No separator, return as is (will be treated as search term)
        return cleanLine;
      })
      .filter(Boolean) // Remove empty lines
      .join('\n');
  };

  // Process extracted text from OCR with improved cleaning
  const processExtractedText = (text: string): string => {
    // Split by lines and clean
    const lines = text.split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    
    // Process each line to try to extract track and artist information
    return lines
      .map(line => {
        // Remove any header/title text that might be in all caps
        if (line.toUpperCase() === line && line.length > 10) {
          return '';
        }
        
        // Remove numbering that might be at the beginning (like "1. " or "01 -")
        let processed = line.replace(/^(\d+[.\s)\-:]+|\[\s*\d+\]\s*)/i, '');
        
        // Handle parenthetical descriptions - remove everything in parentheses
        processed = processed.replace(/\s*\([^)]+\)\s*/g, ' ');
        
        // Check for common separators and replace with standardized format
        if (/\t|\s{3,}|•|\||[-–—]/.test(processed)) {
          processed = processed.replace(/\t+|\s{3,}|\s*•\s*|\s*\|\s*|\s*[-–—]\s*/g, ' - ');
        }
        
        // Handle common OCR errors (0 for O, l for I, etc.)
        processed = processed
          .replace(/0(?=\s)/g, 'O')     // Replace 0 with O at word boundaries
          .replace(/1(?=\s)/g, 'I')     // Replace 1 with I at word boundaries
          .replace(/l(?=\s)/g, 'I')     // Replace l with I at word boundaries
          .replace(/\b5\b/g, 'S')       // Replace standalone 5 with S
          .replace(/\b8\b/g, 'B');      // Replace standalone 8 with B
        
        // Additional cleanup for OCR artifacts
        processed = processed
          .replace(/["""''`]/g, '')     // Remove quotes
          .replace(/\s+/g, ' ')         // Normalize spaces
          .replace(/^\s*[-–—]\s*/, '')  // Remove leading dash
          .replace(/\s*[-–—]\s*$/, ''); // Remove trailing dash
        
        // Remove header text like "< Saved" or "SONGS YOU NEED TO FEEL"
        if (/^[<>]|^SONGS|^AT LEAST|^\d+ \d+ o \d+/.test(processed)) {
          return '';
        }
        
        // If the cleaned up text doesn't have a dash but has "and" or "&", 
        // it might be a song with multiple artists
        if (!processed.includes('-') && /\s(&|and)\s/.test(processed)) {
          // Find a potential artist name after "and" or "&"
          const match = processed.match(/\s(&|and)\s+([A-Z][a-z]+(\s[A-Z][a-z]+)?)/);
          if (match) {
            // Try to split into "Song - Artist & Featured Artist" format
            const potentialArtist = match[2];
            const potentialSong = processed.split(/\s+(&|and)\s+/)[0];
            return `${potentialSong} - ${potentialArtist}`;
          }
        }
        
        return processed;
      })
      .filter(line => {
        // Filter out very short lines or lines without proper formatting
        if (line.length < 2) return false;
        
        // Keep only lines that have artist and track information
        // (either contains a dash or looks like a valid track name)
        return line.includes('-') || /^[A-Z0-9]/.test(line);
      })
      .join('\n');
  };

  const processImageFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setIsSuccess(false);
    setOriginalContent("");
    setExtractedContent("");

    try {
      if (!tesseractLoaded) {
        throw new Error("Text recognition engine not loaded yet. Please try again in a moment.");
      }

      // Convert file to base64 instead of using URL object
      const base64Image = await fileToBase64(file);
      
      try {
        // Use dynamic import for Tesseract
        const Tesseract = await import('tesseract.js');
        
        // Create worker with the correct API for v4
        const worker = await Tesseract.createWorker({
          logger: msg => console.log(msg)
        });
        
        // Initialize worker properly with v4 API
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        // Log progress for debugging
        console.log('Worker created, recognizing image...');
        
        // Recognize text in the image
        const result = await worker.recognize(base64Image);
        
        // Clean up worker resources
        await worker.terminate();
        
        // Get the text from the result
        const extractedText = result.data.text;
        
        // Store the original content
        setOriginalContent(extractedText);
        
        // Process the text with our regular method
        const processedText = processExtractedText(extractedText);
        
        // Store the processed text
        setExtractedContent(processedText);
        
        // Show success state
        setIsSuccess(true);
      } catch (err) {
        console.error('Tesseract error:', err);
        throw new Error(`OCR processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setFileType(file.type);
    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);

    // Check if it's an image file
    if (file.type.startsWith('image/')) {
      processImageFile(file);
      return;
    }

    // Otherwise, process as text file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const processedContent = processContent(content);
        setExtractedContent(processedContent);
        setIsSuccess(true);
        onFileContent(processedContent);
      } catch (err) {
        console.error('Error processing file:', err);
        setError('Failed to process file. Please check the format.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Handle AI cleaning
  const handleAICleaning = async () => {
    if (!originalContent) return;
    
    setIsCleaningWithAI(true);
    
    try {
      const result = await cleanText(originalContent);
      
      if (result.cleanedText) {
        setExtractedContent(result.cleanedText);
      } else if (result.error) {
        setError(`AI cleaning failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error using AI to clean text:', err);
      setError('Failed to clean text with AI. Using standard processing instead.');
    } finally {
      setIsCleaningWithAI(false);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    console.log('Continue button clicked with content length:', extractedContent.length);
    // Parse the lines and prepare for song selection
    const songs = extractedContent
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    
    setExtractedSongs(songs);
    setShowSongSelection(true);
  };

  // Handle song selection continue
  const handleSongSelectionContinue = (selectedSongs: string[]) => {
    // Join the selected songs back with newlines
    const finalContent = selectedSongs.join('\n');
    console.log('Final content after song selection:', finalContent);
    
    // Save directly to localStorage to ensure it's available on the review page
    if (typeof window !== 'undefined' && finalContent.trim()) {
      console.log('Saving track list to localStorage before direct navigation');
      localStorage.setItem("trackList", finalContent);
      
      // Navigate directly to the review page
      router.push('/review');
    } else {
      // If no content, just pass it to the parent component
      onFileContent(finalContent);
      setShowSongSelection(false);
    }
  };

  // Handle song selection cancel
  const handleSongSelectionCancel = () => {
    setShowSongSelection(false);
  };

  // Update the Button click handler to click the hidden input
  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (showSongSelection) {
    return (
      <SongSelection 
        initialSongs={extractedSongs}
        onContinue={handleSongSelectionContinue}
        onCancel={handleSongSelectionCancel}
      />
    );
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
            <Button 
              variant="outline" 
              type="button" 
              size="sm" 
              disabled={isProcessing || isCleaningWithAI}
              onClick={handleBrowseClick}
            >
              {isProcessing ? "Processing..." : "Browse Files"}
            </Button>
            <input 
              ref={fileInputRef}
              id="file-upload" 
              type="file" 
              accept=".txt,.csv,image/jpeg,image/png,image/jpg" 
              className="hidden" 
              onChange={handleFileInput} 
            />
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
            {fileType.startsWith('image') ? 'Extracting text from image (this may take a minute)...' : 'Processing file...'}
          </p>
        </div>
      )}
      
      {isCleaningWithAI && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Using AI to clean and format the extracted text...
          </p>
        </div>
      )}
      
      {isSuccess && fileType.startsWith('image') && !isProcessing && !isCleaningWithAI && (
        <div className="text-center py-4">
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-green-600 dark:text-green-400"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Text successfully extracted! {extractedContent.split('\n').filter(Boolean).length} tracks detected.
            </AlertDescription>
          </Alert>
          
          <div className="mb-4">
            <Button 
              variant="outline" 
              size="sm"
              className="mb-2"
              onClick={handleAICleaning}
              disabled={isAILoading || !originalContent}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                <path d="M12 8V3"/>
                <path d="M12 21v-5"/>
                <path d="M8 12H3"/>
                <path d="M21 12h-5"/>
              </svg>
              Use AI to Clean Up Text
            </Button>
            <p className="text-xs text-muted-foreground">
              Our AI can try to identify and format song titles and artists more accurately
            </p>
          </div>
          
          <div className="border border-accent p-4 rounded-md mb-4 max-h-48 overflow-y-auto text-left">
            <p className="text-sm text-muted-foreground mb-2">Preview of extracted content:</p>
            <pre className="text-xs whitespace-pre-wrap">
              {extractedContent.split('\n').filter(Boolean).slice(0, 10).join('\n')}
              {extractedContent.split('\n').filter(Boolean).length > 10 ? '\n...' : ''}
            </pre>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm">Ready to review and customize your track list?</p>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleContinue}
            >
              Continue and Customize Tracks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
