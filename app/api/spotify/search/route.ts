import { NextResponse } from "next/server"

// Constants
const API_ENDPOINT = "https://api.spotify.com/v1"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const accessToken = searchParams.get("token")
    const limit = searchParams.get("limit") || "5" // Default to 5 if not provided

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 401 })
    }

    // Search for tracks
    const searchResponse = await fetch(
      `${API_ENDPOINT}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error("Search error:", errorData)
      return NextResponse.json({ error: "Failed to search tracks" }, { status: searchResponse.status })
    }

    const searchData = await searchResponse.json()

    // Transform the response to match our Track interface
    const tracks = searchData.tracks.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      artist: item.artists.map((artist: any) => artist.name).join(", "),
      album: item.album.name,
      artwork: item.album.images[0]?.url || null,
      uri: item.uri,
    }))

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
