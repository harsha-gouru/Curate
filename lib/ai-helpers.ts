import type { Track } from "@/types/music"

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Helper function to check if we should use mock responses
function shouldUseMockResponses(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  return !apiKey || isDevelopment;
}

// Helper to extract relevant words from track data for better mock responses
function extractKeywordsFromTracks(tracks: Track[]): string[] {
  const allText = tracks.map(t => `${t.name} ${t.artist}`).join(" ").toLowerCase();
  const words = allText.split(/\s+/).filter(w => w.length > 3);
  
  // Filter out common words
  const commonWords = ["feat", "with", "remix", "edit", "version", "original", "club"];
  return [...new Set(words.filter(w => !commonWords.includes(w)))].slice(0, 5);
}

// Generate more realistic names from the track data
function generateRealisticMockName(tracks: Track[], mood: string): string {
  // Extract some words from the tracks
  const keywords = extractKeywordsFromTracks(tracks);
  
  // Get artists/genres from the tracks
  const artists = [...new Set(tracks.map(t => t.artist.split(/\s+/)[0]))].slice(0, 2);
  
  // Various template structures for playlist names
  const templates = [
    () => `${mood} ${keywords[0] || "Vibes"}`,
    () => `${artists[0] || "Artist"} ${mood} Mix`,
    () => `${keywords[0] || "Music"} ${keywords[1] || "Collection"}`,
    () => `The ${mood} Sessions`,
    () => `${artists.join(" & ")} ${keywords[0] || "Essentials"}`,
    () => `${mood} ${keywords[Math.floor(Math.random() * keywords.length)] || "Soundscape"}`,
    () => `${mood} State of Mind`,
    () => `${artists[0] || "Playlist"}: ${mood} Edition`
  ];
  
  // Select a random template
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template().replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to make OpenAI API calls
async function callOpenAI(prompt: string, maxTokens: number = 300): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    // Fall back to mock responses if API key is not available
    if (!apiKey) {
      console.info("OpenAI API key not available, using mock responses");
      return "MOCK_RESPONSE";
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a creative assistant specializing in music and playlist curation."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        // Get more detailed error information
        const statusCode = response.status;
        const responseBody = await response.text().catch(() => "");
        console.warn(`OpenAI API request failed (${statusCode}): ${response.statusText}. Using mock response instead.`);
        if (responseBody) {
          console.debug("API response details:", responseBody);
        }
        return "MOCK_RESPONSE";
      }
      
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (fetchError) {
      console.warn("Network error during OpenAI API call. Using mock response instead.", fetchError);
      return "MOCK_RESPONSE";
    }
  } catch (error) {
    console.warn("Error in OpenAI API call handling. Using mock response instead.", error);
    return "MOCK_RESPONSE";
  }
}

// Generate playlist names with AI
export async function generatePlaylistName(tracks: Track[], mood: string): Promise<string[]> {
  // Create a prompt with track information
  const trackList = tracks.slice(0, 10).map(track => `"${track.name}" by ${track.artist}`).join("\n");
  
  const prompt = `Create 4 creative and catchy playlist names for a collection of songs with a ${mood} mood. 
The playlist includes songs like:
${trackList}

Give only the names, one per line, without numbering or quotes. Each name should be under 40 characters.`;

  // If we should use mock responses, return them directly without calling API
  if (shouldUseMockResponses()) {
    console.info("Using mock playlist names");
    return getMockPlaylistNames(mood, tracks);
  }

  try {
    const response = await callOpenAI(prompt, 200);
    
    // If we got a mock response, return mock data
    if (response === "MOCK_RESPONSE") {
      return getMockPlaylistNames(mood, tracks);
    }
    
    // Split by newlines and filter out empty lines
    const names = response.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 4);
    
    // If we got fewer than 4 names, add some mock names
    if (names.length < 4) {
      const mockNames = getMockPlaylistNames(mood, tracks);
      for (let i = names.length; i < 4; i++) {
        names.push(mockNames[i]);
      }
    }
    
    return names;
  } catch (error) {
    console.warn("Error generating playlist names:", error);
    return getMockPlaylistNames(mood, tracks);
  }
}

// Generate playlist description with AI
export async function generatePlaylistDescription(tracks: Track[], mood: string): Promise<string> {
  // Create a prompt with track information
  const trackList = tracks.slice(0, 10).map(track => `"${track.name}" by ${track.artist}`).join("\n");
  
  const prompt = `Write a short, poetic description for a playlist with a ${mood} mood. 
The playlist includes songs like:
${trackList}

The description should be 2-3 sentences long, evocative, and capture the essence of the mood. Don't use phrases like "this playlist".`;

  // If we should use mock responses, return them directly without calling API
  if (shouldUseMockResponses()) {
    console.info("Using mock playlist description");
    return getMockPlaylistDescription(mood, tracks);
  }

  try {
    const response = await callOpenAI(prompt, 150);
    
    // If we got a mock response, return mock data
    if (response === "MOCK_RESPONSE") {
      return getMockPlaylistDescription(mood, tracks);
    }
    
    return response;
  } catch (error) {
    console.warn("Error generating playlist description:", error);
    return getMockPlaylistDescription(mood, tracks);
  }
}

// Mock functions to use as fallbacks
function getMockPlaylistNames(mood: string, tracks: Track[] = []): string[] {
  const moodLower = mood.toLowerCase();
  
  // Generate some names based on track data if available
  if (tracks.length > 0) {
    return [
      generateRealisticMockName(tracks, mood),
      generateRealisticMockName(tracks, mood),
      generateRealisticMockName(tracks, mood),
      generateRealisticMockName(tracks, mood)
    ];
  }

  if (moodLower.includes("chill") || moodLower.includes("relax")) {
    return ["Sunset Serenity", "Gentle Waves", "Calm Horizons", "Peaceful Moments"];
  } else if (moodLower.includes("energetic") || moodLower.includes("workout")) {
    return ["Power Pulse", "Adrenaline Rush", "Beat Elevation", "Momentum Surge"];
  } else if (moodLower.includes("nostalgic") || moodLower.includes("90s")) {
    return ["Time Capsule: 90s Edition", "Retro Rewind", "Memory Lane Melodies", "Throwback Therapy"];
  } else {
    return [`${mood} Vibes`, `The ${mood} Collection`, `${mood} Soundscape`, `${mood} Journey`];
  }
}

function getMockPlaylistDescription(mood: string, tracks: Track[] = []): string {
  const moodLower = mood.toLowerCase();
  
  // Extract track data for more personalized descriptions
  if (tracks.length > 0) {
    const artists = [...new Set(tracks.map(t => t.artist))].slice(0, 3);
    const artistText = artists.length > 1 
      ? `${artists.slice(0, -1).join(", ")} and ${artists[artists.length-1]}`
      : artists[0];
    
    const keywords = extractKeywordsFromTracks(tracks);
    const keyword = keywords[Math.floor(Math.random() * keywords.length)] || "sounds";
    
    // Various template structures for descriptions
    const templates = [
      () => `A journey through ${moodLower} ${keyword} featuring the musical talents of ${artistText}. Perfect for those moments when you want to immerse yourself in captivating melodies.`,
      () => `Explore the ${moodLower} side of music with this collection highlighting ${artistText}. Each track creates a unique atmosphere that resonates with emotion.`,
      () => `Curated ${moodLower} selections featuring inspired works from ${artistText}. Let the rhythms and melodies transport you to a different state of mind.`,
      () => `${mood} tunes carefully selected to create the perfect ambiance. Artists like ${artistText} guide you through a musical landscape full of rich textures.`
    ];
    
    // Select a random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template();
  }

  if (moodLower.includes("chill") || moodLower.includes("relax")) {
    return "A soothing collection of melodies designed to calm the mind and ease the soul. Perfect for unwinding after a long day or creating a peaceful atmosphere.";
  } else if (moodLower.includes("energetic") || moodLower.includes("workout")) {
    return "High-energy tracks curated to fuel your workout and keep your momentum going. These beats will push you through any challenge and elevate your performance.";
  } else if (moodLower.includes("nostalgic") || moodLower.includes("90s")) {
    return "Take a journey back in time with these nostalgic tracks that capture the essence of an unforgettable era. Each song is a doorway to cherished memories.";
  } else {
    return `A carefully curated playlist that embodies the essence of ${mood}. These tracks blend together to create an immersive experience that resonates with your current state of mind.`;
  }
}

// Automatically analyze tracks to suggest a mood
export async function analyzeTracksAndSuggestMood(tracks: Track[]): Promise<string> {
  // If we should use mock responses, skip the API call and go straight to analysis
  if (shouldUseMockResponses()) {
    console.info("Using track analysis to determine mood");
    return analyzeTracksLocally(tracks);
  }
  
  // Create a prompt with track information
  const trackList = tracks.slice(0, 10).map(track => `"${track.name}" by ${track.artist}`).join("\n");
  
  const prompt = `Analyze these songs and suggest a single word or short phrase (2-3 words max) that captures their collective mood or theme:
${trackList}

Give only one word or short phrase, nothing else.`;

  try {
    const response = await callOpenAI(prompt, 50);
    
    // If we got a mock response, use local analysis
    if (response === "MOCK_RESPONSE") {
      return analyzeTracksLocally(tracks);
    }
    
    return response.trim();
  } catch (error) {
    console.warn("Error analyzing tracks:", error);
    return analyzeTracksLocally(tracks);
  }
}

// Local analysis without API
function analyzeTracksLocally(tracks: Track[]): string {
  // Extract all text for keyword analysis
  const allText = tracks.map(t => `${t.name} ${t.artist}`).join(" ").toLowerCase();
  
  // Try to detect genre first
  const genres = [
    { keywords: ["rock", "guitar", "band"], mood: "Rock Energy" },
    { keywords: ["pop", "hit"], mood: "Pop Vibes" },
    { keywords: ["hip hop", "hip-hop", "rap"], mood: "Hip Hop Beats" },
    { keywords: ["electronic", "techno", "house", "edm", "dance"], mood: "Electronic Pulse" },
    { keywords: ["jazz", "saxophone", "trumpet", "blues"], mood: "Jazz Mood" },
    { keywords: ["classical", "symphony", "orchestra", "piano"], mood: "Classical Elegance" },
    { keywords: ["chill", "ambient", "relax"], mood: "Chill Atmosphere" },
    { keywords: ["folk", "acoustic"], mood: "Folk Tales" },
    { keywords: ["indie", "alternative"], mood: "Indie Experience" },
    { keywords: ["country", "western"], mood: "Country Roads" },
    { keywords: ["r&b", "soul"], mood: "Soul Session" },
    { keywords: ["metal", "heavy"], mood: "Metal Energy" }
  ];
  
  for (const genre of genres) {
    if (genre.keywords.some(keyword => allText.includes(keyword))) {
      return genre.mood;
    }
  }
  
  // Try to detect mood from track titles and artists
  const moods = [
    { keywords: ["love", "heart", "romance"], mood: "Romantic Essence" },
    { keywords: ["party", "club", "dance"], mood: "Party Mix" },
    { keywords: ["dream", "night", "sleep"], mood: "Dreamy Nights" },
    { keywords: ["summer", "beach", "sun"], mood: "Summer Vibes" },
    { keywords: ["travel", "journey", "road"], mood: "Journey Soundtrack" },
    { keywords: ["happy", "joy", "smile"], mood: "Happy Moments" },
    { keywords: ["sad", "blue", "lonely"], mood: "Melancholic Reflection" },
    { keywords: ["energy", "power", "strong"], mood: "Powerful Energy" }
  ];
  
  for (const mood of moods) {
    if (mood.keywords.some(keyword => allText.includes(keyword))) {
      return mood.mood;
    }
  }
  
  // Default to a time-based mood if nothing specific is found
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning Inspiration";
  if (hour >= 12 && hour < 18) return "Afternoon Groove";
  if (hour >= 18 && hour < 22) return "Evening Chill";
  return "Night Vibes";
}

// Automatically generate playlist name and description without a user-provided mood
export async function autoGeneratePlaylistDetails(tracks: Track[]): Promise<{
  names: string[];
  description: string;
  suggestedMood: string;
}> {
  try {
    // First, analyze tracks to determine a mood
    const suggestedMood = await analyzeTracksAndSuggestMood(tracks);
    
    // Then generate names and description based on that mood
    const names = await generatePlaylistName(tracks, suggestedMood);
    const description = await generatePlaylistDescription(tracks, suggestedMood);
    
    return {
      names,
      description,
      suggestedMood
    };
  } catch (error) {
    console.error("Error auto-generating playlist details:", error);
    // Fallback to generic values
    return {
      names: ["My Awesome Playlist", "Track Collection", "Custom Mix", "Personal Favorites"],
      description: "A personalized collection of tracks curated based on your music taste.",
      suggestedMood: "Mixed"
    };
  }
}
