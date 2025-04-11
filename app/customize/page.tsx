"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import type { Track } from "@/types/music"
import { 
  generatePlaylistName, 
  generatePlaylistDescription, 
  autoGeneratePlaylistDetails 
} from "@/lib/ai-helpers"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function CustomizePage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [mood, setMood] = useState("")
  const [suggestedMood, setSuggestedMood] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutoLoading, setIsAutoLoading] = useState(true)
  const [playlistName, setPlaylistName] = useState("")
  const [playlistDescription, setPlaylistDescription] = useState("")
  const [generatedNames, setGeneratedNames] = useState<string[]>([])
  const [useManualMode, setUseManualMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get the selected tracks from localStorage
    const tracksJson = localStorage.getItem("selectedTracks")
    if (tracksJson) {
      const parsedTracks = JSON.parse(tracksJson)
      setTracks(parsedTracks)
      
      // Auto-generate playlist details
      generateAutomatically(parsedTracks)
    } else {
      router.push("/create")
    }
  }, [router])
  
  // Function to generate playlist details automatically
  const generateAutomatically = async (trackList: Track[]) => {
    setIsAutoLoading(true)
    
    try {
      const autoDetails = await autoGeneratePlaylistDetails(trackList)
      
      setGeneratedNames(autoDetails.names)
      setPlaylistName(autoDetails.names[0] || "")
      setPlaylistDescription(autoDetails.description)
      setSuggestedMood(autoDetails.suggestedMood)
      setMood(autoDetails.suggestedMood)
    } catch (error) {
      console.error("Error auto-generating playlist details:", error)
    } finally {
      setIsAutoLoading(false)
    }
  }

  const handleGenerateNameAndDescription = async () => {
    if (!mood.trim()) return

    setIsGenerating(true)

    try {
      // In a real app, we would call the OpenAI API here
      // For now, we'll use mock functions
      const names = await generatePlaylistName(tracks, mood)
      const description = await generatePlaylistDescription(tracks, mood)

      setGeneratedNames(names)
      setPlaylistName(names[0] || "")
      setPlaylistDescription(description)
    } catch (error) {
      console.error("Error generating playlist details:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContinue = () => {
    // Store the playlist details
    localStorage.setItem(
      "playlistDetails",
      JSON.stringify({
        name: playlistName,
        description: playlistDescription,
      }),
    )
    router.push("/preview")
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl mb-3">Customize Playlist</h1>
        <p className="text-muted-foreground">
          {isAutoLoading ? "Analyzing your tracks and creating your playlist..." : "Review generated playlist details or customize them"}
        </p>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="manual-mode" 
                checked={useManualMode} 
                onCheckedChange={setUseManualMode} 
              />
              <Label htmlFor="manual-mode">Manual customization</Label>
            </div>
            {!isAutoLoading && !useManualMode && (
              <div className="text-sm text-muted-foreground">
                Detected mood: <span className="font-medium">{suggestedMood}</span>
              </div>
            )}
          </div>
          
          {useManualMode ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="mood" className="block text-sm font-medium mb-2">
                  What mood or genre describes this playlist?
                </label>
                <Input
                  id="mood"
                  placeholder="e.g., Chill summer vibes, Energetic workout, Nostalgic 90s"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGenerateNameAndDescription} disabled={!mood.trim() || isGenerating}>
                  {isGenerating ? (
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
                      Generating...
                    </>
                  ) : (
                    "Generate with AI"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-28">
              {isAutoLoading ? (
                <div className="flex flex-col items-center">
                  <svg
                    className="animate-spin mb-3 h-10 w-10 text-primary"
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
                  <p className="text-sm text-muted-foreground">Analyzing tracks and generating playlist details...</p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  We've automatically generated playlist details based on your tracks.<br />
                  You can edit them below or switch to manual mode for more control.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {(generatedNames.length > 0 || !isAutoLoading) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="playlistName" className="block text-sm font-medium mb-2">
                  Choose or edit a playlist name
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {generatedNames.map((name, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`justify-start h-auto py-2 px-4 ${playlistName === name ? "border-accent" : ""}`}
                      onClick={() => setPlaylistName(name)}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
                <Input
                  id="playlistName"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Custom playlist name"
                />
              </div>

              <div>
                <label htmlFor="playlistDescription" className="block text-sm font-medium mb-2">
                  Playlist description
                </label>
                <Textarea
                  id="playlistDescription"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Describe your playlist"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/review")}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={isAutoLoading || !playlistName.trim()}>
          Preview
        </Button>
      </div>
    </div>
  )
}
