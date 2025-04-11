"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SpotifyAuthButtonProps {
  onAuthenticated: () => void
}

export default function SpotifyAuthButton({ onAuthenticated }: SpotifyAuthButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showError, setShowError] = useState(false)

  const handleAuthenticate = async () => {
    setIsAuthenticating(true)
    setShowError(false)

    try {
      // Generate a random state value for security
      const state = Math.random().toString(36).substring(2, 15)
      localStorage.setItem("spotify_auth_state", state)

      // Define the scopes we need
      const scopes = [
        "playlist-read-private",
        "playlist-modify-private",
        "playlist-modify-public",
        "user-read-private",
        "user-read-email",
      ]

      // Use the redirect URI from environment variables
      // This should match exactly what's in your Spotify Dashboard
      const redirectUri = "https://928c-2600-8804-9c06-1c00-db02-bb25-3292-4638.ngrok-free.app/auth/callback"

      // Build the Spotify authorization URL
      const spotifyAuthUrl = new URL("https://accounts.spotify.com/authorize")
      spotifyAuthUrl.searchParams.append("client_id", process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "")
      spotifyAuthUrl.searchParams.append("response_type", "code")
      spotifyAuthUrl.searchParams.append("redirect_uri", redirectUri)
      spotifyAuthUrl.searchParams.append("state", state)
      spotifyAuthUrl.searchParams.append("scope", scopes.join(" "))

      // Redirect to Spotify for authorization
      window.location.href = spotifyAuthUrl.toString()
    } catch (error) {
      console.error("Authentication error:", error)
      setIsAuthenticating(false)
      setShowError(true)
    }
  }

  return (
    <div className="flex flex-col items-center p-6 bg-accent/5 rounded-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-4"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
      <h3 className="text-lg font-medium mb-2">Connect to Spotify</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">
        To create your playlist, you need to authenticate with your Spotify account.
      </p>

      {showError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-sm">
          <p className="font-medium">Authentication Error</p>
          <p>Please make sure you've added the following redirect URI to your Spotify app:</p>
          <code className="block bg-red-100 p-2 mt-1 rounded text-xs overflow-auto">
            https://928c-2600-8804-9c06-1c00-db02-bb25-3292-4638.ngrok-free.app/auth/callback
          </code>
        </div>
      )}

      <Button onClick={handleAuthenticate} disabled={isAuthenticating} className="bg-[#1DB954] hover:bg-[#1AA34A]">
        {isAuthenticating ? (
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
            Connecting...
          </>
        ) : (
          "Connect Spotify"
        )}
      </Button>
    </div>
  )
}
