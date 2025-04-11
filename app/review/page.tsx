"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import TrackItem from "@/components/track-item"
import type { Track } from "@/types/music"
import { searchTracks, isAuthenticated } from "@/lib/spotify-api"
import SpotifyAuthButton from "@/components/spotify-auth-button"
import SpotifySetupInstructions from "@/components/spotify-setup-instructions"
import { useToast } from "@/hooks/use-toast"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function ReviewMatchesPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  const [showSetupInstructions, setShowSetupInstructions] = useState(false)
  const [tracksPerSearch, setTracksPerSearch] = useState<number>(5)
  const [searchMode, setSearchMode] = useState<'exact' | 'similar'>('exact')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // Check if there's an error parameter in the URL
    const error = searchParams.get("error")
    if (error === "invalid_client") {
      setShowSetupInstructions(true)
    }

    // Check if user is already authenticated
    const checkAuth = typeof isAuthenticated === "function" ? isAuthenticated() : false
    setIsUserAuthenticated(checkAuth)

    // Get the track list from localStorage
    const trackList = localStorage.getItem("trackList") || ""
    console.log("Track list from localStorage:", trackList)
    
    const trackLines = trackList.split("\n").filter((line) => line.trim())
    console.log("Parsed track lines:", trackLines)

    if (trackLines.length === 0) {
      console.log("No tracks found in localStorage")
      setIsLoading(false)
      return
    }

    // Only search for tracks if the user is authenticated
    if (checkAuth) {
      searchForTracks(trackLines)
    } else {
      setIsLoading(false)
    }
  }, [searchParams])

  const searchForTracks = async (trackLines: string[]) => {
    setIsLoading(true)
    console.log(`Starting search for tracks with lines (mode: ${searchMode}):`, trackLines)

    try {
      // Search for tracks one by one
      const results: Track[] = []

      for (const line of trackLines) {
        try {
          // Process the line to handle different formats
          let processedLine = line.trim()
          
          // Skip empty lines
          if (!processedLine) continue
          
          console.log("Searching for track:", processedLine)
          
          // If line contains tabs, convert to a dash format
          if (processedLine.includes('\t')) {
            processedLine = processedLine.replace(/\s*\t+\s*/g, ' - ')
          }
          
          // Pass the search mode to the API
          const trackResults = await searchTracks(processedLine, tracksPerSearch, searchMode === 'exact')
          console.log(`Found ${trackResults.length} results for "${processedLine}"`)
          
          if (trackResults.length > 0) {
            // If in exact mode, only take the first result
            if (searchMode === 'exact') {
              results.push(trackResults[0])
            } else {
              results.push(...trackResults)
            }
          }
        } catch (error) {
          console.error(`Error searching for "${line}":`, error)
        }
      }

      console.log(`Found ${results.length} total tracks from ${trackLines.length} search terms`)
      setTracks(results)
      
      if (results.length === 0) {
        toast({
          title: "No tracks found",
          description: "Try switching to 'Similar Songs' mode to find more matches.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error searching for tracks:", error)
      toast({
        title: "Error",
        description: "Failed to search for tracks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthenticated = () => {
    setIsUserAuthenticated(true)

    // Get the track list from localStorage
    const trackList = localStorage.getItem("trackList") || ""
    const trackLines = trackList.split("\n").filter((line) => line.trim())

    if (trackLines.length > 0) {
      searchForTracks(trackLines)
    }
  }

  const handleRemoveTrack = (id: string) => {
    setTracks(tracks.filter((track) => track.id !== id))
  }

  const handleContinue = (skipCustomize = false) => {
    // Store the selected tracks
    localStorage.setItem("selectedTracks", JSON.stringify(tracks))
    
    if (skipCustomize) {
      // Set a flag to indicate we're auto-generating
      localStorage.setItem("autoGeneratePlaylist", "true")
      router.push("/preview")
    } else {
      router.push("/customize")
    }
  }

  const handleRetrySearch = () => {
    const trackList = localStorage.getItem("trackList") || ""
    const trackLines = trackList.split("\n").filter((line) => line.trim())
    if (trackLines.length > 0) {
      searchForTracks(trackLines)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl mb-3">Review Matches</h1>
        <p className="text-muted-foreground">We found these songs on Spotify. Review and adjust if needed.</p>
      </div>

      {showSetupInstructions && <SpotifySetupInstructions />}

      {!isUserAuthenticated && (
        <div className="mb-8">
          <SpotifyAuthButton onAuthenticated={handleAuthenticated} />
        </div>
      )}

      {isUserAuthenticated && !isLoading && (
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="space-y-1">
                  <Label htmlFor="tracksPerSearch">Tracks per search</Label>
                  <Select 
                    value={tracksPerSearch.toString()} 
                    onValueChange={(value) => setTracksPerSearch(Number(value))}
                  >
                    <SelectTrigger id="tracksPerSearch" className="w-[180px]">
                      <SelectValue placeholder="Select number of tracks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 tracks</SelectItem>
                      <SelectItem value="5">5 tracks</SelectItem>
                      <SelectItem value="10">10 tracks</SelectItem>
                      <SelectItem value="20">20 tracks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="searchMode">Search mode</Label>
                  <Select 
                    value={searchMode} 
                    onValueChange={(value: 'exact' | 'similar') => {
                      setSearchMode(value);
                      // Re-run search with new mode
                      const trackList = localStorage.getItem("trackList") || "";
                      const trackLines = trackList.split("\n").filter((line) => line.trim());
                      if (trackLines.length > 0) {
                        searchForTracks(trackLines);
                      }
                    }}
                  >
                    <SelectTrigger id="searchMode" className="w-[180px]">
                      <SelectValue placeholder="Select search mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">Exact matches</SelectItem>
                      <SelectItem value="similar">Similar songs</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchMode === 'exact' 
                      ? 'Shows only the closest match for each song' 
                      : 'Shows multiple similar songs for each search'}
                  </p>
                </div>
                
                <Button onClick={handleRetrySearch} variant="outline" className="md:self-end">
                  Refresh Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-16 w-16 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {tracks.length > 0 ? (
                tracks.map((track) => <TrackItem key={track.id} track={track} onRemove={handleRemoveTrack} />)
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    {isUserAuthenticated
                      ? "No tracks found. This could be due to formatting issues or Spotify not recognizing the songs."
                      : "Please connect to Spotify to search for tracks."}
                  </p>
                  
                  {isUserAuthenticated && (
                    <>
                      <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 text-sm space-y-2">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Troubleshooting tips:</p>
                        <ul className="list-disc pl-5 text-amber-700 dark:text-amber-400">
                          <li>Make sure your songs are in "Song Title - Artist Name" format</li>
                          <li>Try removing any special characters or descriptions</li>
                          <li>Check if the artists and songs are available on Spotify</li>
                          <li>Try searching for just the song title without the artist</li>
                        </ul>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-4">
                        <Button variant="outline" onClick={() => router.push("/create")} className="w-full">
                          Go Back and Edit Tracks
                        </Button>
                        <Button variant="outline" onClick={handleRetrySearch} className="w-full">
                          Retry Search with Different Settings
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/create")}>
          Back
        </Button>
        <div className="space-x-3">
          <Button 
            variant="outline" 
            onClick={() => handleContinue(true)} 
            disabled={tracks.length === 0 || !isUserAuthenticated}
          >
            Auto-Create Playlist
          </Button>
          <Button onClick={() => handleContinue()} disabled={tracks.length === 0 || !isUserAuthenticated}>
            Customize
          </Button>
        </div>
      </div>
    </div>
  )
}
