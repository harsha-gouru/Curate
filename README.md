# Playlist Studio

A modern web application that helps you create beautifully curated playlists from a list of songs. The app automatically organizes your tracks, analyzes their mood, and generates playlist names and descriptions.

## Features

- **Flexible Input**: Paste your songs in any format - with tabs, commas or other separators
- **Smart Parsing**: Automatically detects and formats track and artist information
- **AI-Powered Curation**: Analyzes your tracks to determine mood and theme
- **Automatic Playlist Generation**: Creates playlist names and descriptions based on your tracks
- **Dynamic Grouping**: Organizes tracks into sets with dynamic numbering
- **Spotify Integration**: Connects to Spotify to find tracks and create playlists

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/playlist-studio.git
   cd playlist-studio
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Create a `.env.local` file with your Spotify API credentials:
   ```
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_optional
   ```

4. Start the development server
   ```
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Input Songs**: Enter your tracks in the format "Track Name - Artist Name" or paste from spreadsheets
2. **Review Matches**: Connect to Spotify and review the matched tracks
3. **Generate Playlist**: Choose between automatic or manual playlist customization
4. **Preview & Create**: Review your playlist and create it on Spotify

## MVP Release Tags

- v0.1.0 - Initial MVP with working playlist creation and auto-generation

## License

MIT

## Acknowledgments

- Built with Next.js, Tailwind CSS, and shadcn/ui components
- AI-powered curation using OpenAI API (optional) 