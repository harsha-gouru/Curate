"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import type { Track } from "@/types/music"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { createPlaylist, isAuthenticated } from "@/lib/spotify-api"
import { autoGeneratePlaylistDetails } from "@/lib/ai-helpers"

export default function PreviewPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlistDetails, setPlaylistDetails] = useState({ name: "", description: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [playlistName, setPlaylistName] = useState("")

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = typeof isAuthenticated === "function" ? isAuthenticated() : false
    if (!checkAuth) {
      toast({
        title: "Authentication Required",
        description: "Please connect to Spotify first.",
        variant: "destructive",
      })
      router.push("/review")
      return
    }

    // Get the selected tracks
    const tracksJson = localStorage.getItem("selectedTracks")
    
    // Check if we need to auto-generate
    const shouldAutoGenerate = localStorage.getItem("autoGeneratePlaylist") === "true"
    const detailsJson = localStorage.getItem("playlistDetails")

    if (tracksJson) {
      const parsedTracks = JSON.parse(tracksJson)
      setTracks(parsedTracks)
      
      if (shouldAutoGenerate || !detailsJson) {
        // Auto-generate playlist details
        generatePlaylistDetails(parsedTracks)
      } else if (detailsJson) {
        // Use existing details
        setPlaylistDetails(JSON.parse(detailsJson))
      } else {
        router.push("/create")
      }
      
      // Clear the auto-generate flag
      localStorage.removeItem("autoGeneratePlaylist")
    } else {
      router.push("/create")
    }
  }, [router, toast])
  
  // Function to automatically generate playlist details
  const generatePlaylistDetails = async (trackList: Track[]) => {
    try {
      const autoDetails = await autoGeneratePlaylistDetails(trackList)
      
      const newDetails = {
        name: autoDetails.names[0] || "My Playlist",
        description: autoDetails.description
      }
      
      setPlaylistDetails(newDetails)
      
      // Save to localStorage
      localStorage.setItem("playlistDetails", JSON.stringify(newDetails))
    } catch (error) {
      console.error("Error generating playlist details:", error)
      toast({
        title: "Error",
        description: "Failed to generate playlist details. Please go back and customize manually.",
        variant: "destructive",
      })
    }
  }

  const handleCreatePlaylist = async () => {
    setIsCreating(true)

    try {
      // Create playlist on Spotify
      const playlist = await createPlaylist(playlistDetails.name, playlistDetails.description, tracks)

      setIsCreating(false)
      setIsSuccess(true)
      setPlaylistUrl(playlist.url)
      setPlaylistName(playlist.name)

      toast({
        title: "Playlist Created!",
        description: `"${playlist.name}" has been added to your Spotify library.`,
      })
    } catch (error) {
      console.error("Error creating playlist:", error)
      setIsCreating(false)

      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl mb-3">Preview Playlist</h1>
        <p className="text-muted-foreground">Review your playlist before creating it in Spotify</p>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="bg-accent/5 p-6">
          <h2 className="text-2xl mb-2">{playlistDetails.name}</h2>
          <p className="text-muted-foreground">{playlistDetails.description}</p>
        </div>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Group tracks into sets of 4 + 1 for dynamic numbering */}
            {(() => {
              const groups: Array<{tracks: Track[], groupNumber: number}> = [];
              let currentGroup: Track[] = [];
              let groupCount = 0;
              
              // Create groups of 4 tracks, with the 5th being special
              tracks.forEach((track, index) => {
                currentGroup.push(track);
                if (currentGroup.length === 4 || index === tracks.length - 1) {
                  groups.push({
                    tracks: currentGroup,
                    groupNumber: ++groupCount
                  });
                  currentGroup = [];
                }
              });
              
              return groups.map((group, groupIndex) => (
                <div key={`group-${groupIndex}`} className="space-y-2">
                  {groupIndex > 0 && <div className="h-px bg-border my-4" />}
                  <div className="text-muted-foreground text-sm mb-2">
                    Group {group.groupNumber} {group.tracks.length === 4 ? "- Add fifth song to complete set" : ""}
                  </div>
                  {group.tracks.map((track: Track, index: number) => {
                    // Calculate the display index based on group
                    const displayIndex = (groupIndex * 4) + index + 1;
                    
                    return (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: displayIndex * 0.05 }}
                        className="flex items-center p-2 hover:bg-accent/5 rounded-md"
                      >
                        <div className="w-8 text-muted-foreground mr-4">{displayIndex}</div>
                        <div className="h-10 w-10 bg-muted rounded mr-4">
                          {track.artwork && (
                            <img
                              src={track.artwork || "/placeholder.svg"}
                              alt={track.name}
                              className="h-full w-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{track.name}</div>
                          <div className="text-sm text-muted-foreground">{track.artist}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/customize")}>
          Back
        </Button>
        {isSuccess ? (
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push("/create")}
              variant="outline"
            >
              Create Another Playlist
            </Button>
            <Button
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
              onClick={() => window.open(playlistUrl, "_blank")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
              Open in Spotify
            </Button>
          </div>
        ) : (
          <Button onClick={handleCreatePlaylist} disabled={isCreating}>
            {isCreating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </>
            ) : (
              "Create Playlist"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
