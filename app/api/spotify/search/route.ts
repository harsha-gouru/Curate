import { NextResponse } from "next/server"

// Constants
const API_ENDPOINT = "https://api.spotify.com/v1"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const accessToken = searchParams.get("token")
    const limit = searchParams.get("limit") || "5" // Default to 5 if not provided
    const exactMode = searchParams.get("exact") === "true" // Check if exact mode is enabled

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 401 })
    }

    // Search for tracks
    const searchResponse = await fetch(
      `${API_ENDPOINT}/search?q=${encodeURIComponent(query)}&type=track&limit=${exactMode ? "20" : limit}`, 
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
    let tracks = searchData.tracks.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      artist: item.artists.map((artist: any) => artist.name).join(", "),
      album: item.album.name,
      artwork: item.album.images[0]?.url || null,
      uri: item.uri,
    }))

    // If exact mode is enabled, try to find the best match
    if (exactMode && tracks.length > 0) {
      console.log(`Exact mode enabled, finding best match for: ${query}`);
      
      // Parse the query to extract song and artist
      // Format expected: "Song - Artist"
      const parts = query.split('-').map(part => part.trim().toLowerCase());
      
      if (parts.length === 2) {
        const [songQuery, artistQuery] = parts;
        
        // Look for exact matches first
        let bestMatches = tracks.filter(track => {
          const trackName = track.name.toLowerCase();
          const artistName = track.artist.toLowerCase();
          
          // Try direct match
          return trackName === songQuery && artistName.includes(artistQuery);
        });
        
        // If no exact matches, look for close matches
        if (bestMatches.length === 0) {
          bestMatches = tracks.filter(track => {
            const trackName = track.name.toLowerCase();
            const artistName = track.artist.toLowerCase();
            
            // Check if both track name and artist name include the query parts
            return trackName.includes(songQuery) && artistName.includes(artistQuery);
          });
        }
        
        // If we found any matches, use them
        if (bestMatches.length > 0) {
          tracks = bestMatches.slice(0, Number(limit));
        } else {
          // Otherwise, just take the first few results
          tracks = tracks.slice(0, Number(limit));
        }
      } else {
        // If query is not in expected format, just return top results
        tracks = tracks.slice(0, Number(limit));
      }
    }

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
