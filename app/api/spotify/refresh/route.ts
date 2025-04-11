import { NextResponse } from "next/server"

// Constants
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = "0ffcac0ae2334f45bc80298ca92557a7" // In production, use environment variable

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { refresh_token } = data

    if (!refresh_token) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token refresh error:", errorData)
      return NextResponse.json({ error: "Failed to refresh token" }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
