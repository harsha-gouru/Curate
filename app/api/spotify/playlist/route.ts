import { NextResponse } from "next/server"

// Constants
const API_ENDPOINT = "https://api.spotify.com/v1"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, description, trackUris, accessToken } = data

    if (!name || !trackUris || !accessToken) {
      return NextResponse.json({ error: "Name, track URIs, and access token are required" }, { status: 400 })
    }

    // First, get the current user's profile
    const userResponse = await fetch(`${API_ENDPOINT}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      console.error("User profile error:", errorData)
      return NextResponse.json({ error: "Failed to get user profile" }, { status: userResponse.status })
    }

    const userData = await userResponse.json()
    const userId = userData.id

    // Create a new playlist
    const playlistResponse = await fetch(`${API_ENDPOINT}/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        public: false,
      }),
    })

    if (!playlistResponse.ok) {
      const errorData = await playlistResponse.json()
      console.error("Playlist creation error:", errorData)
      return NextResponse.json({ error: "Failed to create playlist" }, { status: playlistResponse.status })
    }

    const playlistData = await playlistResponse.json()
    const playlistId = playlistData.id

    // Add tracks to the playlist
    const addTracksResponse = await fetch(`${API_ENDPOINT}/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    })

    if (!addTracksResponse.ok) {
      const errorData = await addTracksResponse.json()
      console.error("Add tracks error:", errorData)
      return NextResponse.json({ error: "Failed to add tracks to playlist" }, { status: addTracksResponse.status })
    }

    return NextResponse.json({
      id: playlistId,
      url: playlistData.external_urls.spotify,
      name: playlistData.name,
    })
  } catch (error) {
    console.error("Playlist creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
