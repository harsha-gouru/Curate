import { NextResponse } from "next/server"

// Constants
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = "0ffcac0ae2334f45bc80298ca92557a7" // In production, use environment variable

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { code, redirectUri } = data

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token exchange error:", errorData)
      return NextResponse.json({ error: "Failed to exchange code for token" }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    })
  } catch (error) {
    console.error("Token exchange error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
