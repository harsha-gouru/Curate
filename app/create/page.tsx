"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import FileUpload from "@/components/file-upload"

export default function TrackInputPage() {
  const [trackList, setTrackList] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Process the track list - normalize different formats
    let processedTrackList = trackList;
    
    // Split into lines and process each line
    const lines = processedTrackList.split('\n');
    const processedLines = lines.map(line => {
      let processedLine = line.trim();
      
      // Skip empty lines
      if (!processedLine) return '';
      
      // Handle tab-separated format (most common from spreadsheets)
      if (processedLine.includes('\t')) {
        // Replace multiple consecutive tabs with a single dash
        processedLine = processedLine.replace(/\s*\t+\s*/g, ' - ');
      }
      
      // Handle formats where the separator might not be a dash
      // Common patterns: dots, commas, or multiple spaces
      if (!processedLine.includes('-')) {
        // Multiple spaces (2+) are likely separators
        if (/\s{2,}/.test(processedLine)) {
          processedLine = processedLine.replace(/\s{2,}/g, ' - ');
        }
        // Commas likely separate artist and track 
        else if (processedLine.includes(',')) {
          processedLine = processedLine.replace(/\s*,\s*/, ' - ');
        }
        // Separators like " by ", " from ", etc.
        else if (/\sby\s/i.test(processedLine)) {
          processedLine = processedLine.replace(/\s+by\s+/i, ' - ');
        }
      }
      
      return processedLine;
    });
    
    // Rejoin the processed lines
    processedTrackList = processedLines.filter(Boolean).join('\n');
    
    // Store the processed track list
    localStorage.setItem("trackList", processedTrackList);
    
    // Redirect to review page after a brief delay
    setTimeout(() => {
      router.push("/review");
      setIsLoading(false);
    }, 1500);
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <div className="mb-16 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Create better playlists
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Transform your track list into beautifully curated playlists with AI-enhanced descriptions
        </p>
      </div>

      <Card className="mb-10">
        <CardContent className="p-6">
          <Tabs defaultValue="paste">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="paste">Paste Text</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="paste">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea
                  placeholder="Enter tracks in format: Track Name - Artist Name
Example:
Bohemian Rhapsody - Queen
Imagine - John Lennon"
                  className="min-h-[300px] text-base p-4"
                  value={trackList}
                  onChange={(e) => setTrackList(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!trackList.trim() || isLoading}>
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="upload">
              <FileUpload onFileContent={setTrackList} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Enter your track list with artist names, one per line</p>
        <p className="mt-2">
          <code className="bg-muted p-1 rounded">Song Title - Artist Name</code> or{" "}
          <code className="bg-muted p-1 rounded">Artist Name - Song Title</code>
        </p>
      </div>
    </div>
  )
}
