export interface Track {
  id: string
  name: string
  artist: string
  album?: string
  artwork?: string
  uri?: string // Spotify URI for the track
}

export interface SpotifyTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  expires_at?: number
}
