import type { Track } from "@/types/music"

// Mock function to simulate searching for tracks on Apple Music
export async function mockSearchTracks(query: string): Promise<Track[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

  // Parse the query to extract track name and artist
  let trackName = ""
  let artistName = ""

  if (query.includes("-")) {
    const parts = query.split("-").map((part) => part.trim())
    trackName = parts[0]
    artistName = parts[1] || ""
  } else {
    trackName = query
  }

  // Generate a mock track
  const mockTrack: Track = {
    id: `track-${Math.random().toString(36).substr(2, 9)}`,
    name: trackName,
    artist: artistName || "Unknown Artist",
    album: `Album ${Math.floor(Math.random() * 3) + 1}`,
    artwork: `/placeholder.svg?height=300&width=300`,
  }

  return [mockTrack]
}
