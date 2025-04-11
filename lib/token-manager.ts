import type { SpotifyTokens } from "@/types/music"

const TOKEN_STORAGE_KEY = "spotify_tokens"

export function saveTokens(tokens: SpotifyTokens): void {
  if (typeof window === "undefined") return

  // Calculate when the token will expire
  const expiresAt = Date.now() + tokens.expires_in * 1000
  const tokensWithExpiry = { ...tokens, expires_at: expiresAt }

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokensWithExpiry))
}

export function getTokens(): SpotifyTokens | null {
  if (typeof window === "undefined") return null

  const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!tokensJson) return null

  return JSON.parse(tokensJson)
}

export function clearTokens(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function isTokenExpired(): boolean {
  const tokens = getTokens()
  if (!tokens || !tokens.expires_at) return true

  // Add a buffer of 5 minutes to ensure we refresh before expiration
  return Date.now() > tokens.expires_at - 5 * 60 * 1000
}

export async function refreshAccessToken(): Promise<boolean> {
  const tokens = getTokens()
  if (!tokens || !tokens.refresh_token) return false

  try {
    const response = await fetch("/api/spotify/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: tokens.refresh_token,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    const newTokens = await response.json()

    // Save the new tokens, preserving the refresh token
    saveTokens({
      access_token: newTokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: newTokens.expires_in,
    })

    return true
  } catch (error) {
    console.error("Error refreshing token:", error)
    return false
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  if (isTokenExpired()) {
    const success = await refreshAccessToken()
    if (!success) {
      clearTokens()
      return null
    }
  }

  const tokens = getTokens()
  return tokens?.access_token || null
}
