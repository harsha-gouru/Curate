"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { saveTokens } from "@/lib/token-manager"
import { Button } from "@/components/ui/button"

export default function SpotifyCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const errorParam = searchParams.get("error")
      const storedState = localStorage.getItem("spotify_auth_state")

      // Clear the state from localStorage
      localStorage.removeItem("spotify_auth_state")

      if (errorParam) {
        console.error("Authentication error:", errorParam)

        // If it's an invalid_client error, redirect with the error parameter
        if (errorParam === "invalid_client") {
          router.push("/review?error=invalid_client")
          return
        }

        setError("Authentication failed. Please try again.")
        return
      }

      if (!code || !state || state !== storedState) {
        console.error("Invalid state or missing code")
        setError("Authentication failed. Invalid state or missing code.")
        return
      }

      try {
        // Exchange the code for an access token
        const response = await fetch("/api/spotify/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirectUri: "https://928c-2600-8804-9c06-1c00-db02-bb25-3292-4638.ngrok-free.app/auth/callback",
          }),
        })

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.statusText}`)
        }

        const tokens = await response.json()

        // Save the tokens
        saveTokens(tokens)

        // Redirect back to the review page
        router.push("/review")
      } catch (error) {
        console.error("Token exchange error:", error)
        setError("Failed to complete authentication. Please try again.")
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Card>
        <CardContent className="p-6 text-center">
          {error ? (
            <>
              <div className="text-red-500 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2 className="text-xl font-medium mb-2">Authentication Error</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => router.push("/review")} variant="outline">
                Go Back
              </Button>
            </>
          ) : (
            <>
              <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-medium mb-2">Authenticating with Spotify</h2>
              <p className="text-muted-foreground">Please wait while we complete the authentication process...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
