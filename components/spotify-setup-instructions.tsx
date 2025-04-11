"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy } from "lucide-react"

export default function SpotifySetupInstructions() {
  const [redirectUri, setRedirectUri] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.origin}/auth/callback`)
    }
  }, [])

  const copyToClipboard = () => {
    if (navigator.clipboard && redirectUri) {
      navigator.clipboard.writeText(redirectUri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Spotify App Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Invalid Redirect URI</AlertTitle>
          <AlertDescription>You need to add the redirect URI to your Spotify Developer Dashboard.</AlertDescription>
        </Alert>

        <div className="space-y-4">
          <p>Follow these steps to fix the issue:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Go to the{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                Spotify Developer Dashboard
              </a>
            </li>
            <li>Select your application</li>
            <li>Click on "Edit Settings"</li>
            <li>Under "Redirect URIs", add the following URL:</li>
          </ol>

          <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
            <code className="text-sm flex-1 break-all">{redirectUri}</code>
            <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {copied && <p className="text-green-600 text-sm">Copied to clipboard!</p>}

          <p>After adding the redirect URI, click "Save" and try connecting again.</p>
        </div>
      </CardContent>
    </Card>
  )
}
