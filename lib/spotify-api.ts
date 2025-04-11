import type { Track } from "@/types/music"
import { getValidAccessToken } from "./token-manager"

// Helper function to check if the user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("spotify_tokens") !== null
}

// Search for tracks on Spotify
export async function searchTracks(
  query: string, 
  limit: number = 5, 
  exactMode: boolean = false
): Promise<Track[]> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  try {
    // Add exactMode to the API query parameters
    const url = `/api/spotify/search?q=${encodeURIComponent(query)}&token=${accessToken}&limit=${limit}&exact=${exactMode ? 'true' : 'false'}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.tracks
  } catch (error) {
    console.error("Error searching tracks:", error)
    throw error
  }
}

// Create a playlist on Spotify
export async function createPlaylist(
  name: string,
  description: string,
  tracks: Track[],
): Promise<{ id: string; url: string; name: string }> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  // Extract track URIs
  const trackUris = tracks.map((track) => track.uri).filter(Boolean)

  if (trackUris.length === 0) {
    throw new Error("No valid track URIs provided")
  }

  try {
    const response = await fetch("/api/spotify/playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        trackUris,
        accessToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create playlist: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating playlist:", error)
    throw error
  }
}
