"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Search, CheckCircle2, XCircle } from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface SongSelectionProps {
  initialSongs: string[]
  onContinue: (songs: string[]) => void
  onCancel: () => void
}

export default function SongSelection({ 
  initialSongs, 
  onContinue, 
  onCancel 
}: SongSelectionProps) {
  const [songs, setSongs] = useState<string[]>([])
  const [newSong, setNewSong] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Initialize songs from props
  useEffect(() => {
    if (initialSongs.length > 0) {
      setSongs(initialSongs)
    }
  }, [initialSongs])
  
  const handleAddSong = () => {
    if (newSong.trim() && !songs.includes(newSong.trim())) {
      setSongs([...songs, newSong.trim()])
      setNewSong("")
    }
  }
  
  const handleDeleteSong = (index: number) => {
    const newSongs = [...songs]
    newSongs.splice(index, 1)
    setSongs(newSongs)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSong.trim()) {
      handleAddSong()
    }
  }
  
  const filteredSongs = searchTerm.trim() ? 
    songs.filter(song => song.toLowerCase().includes(searchTerm.toLowerCase())) : 
    songs
  
  const checkSongFormat = (song: string): boolean => {
    // Check if the song has the format "Song - Artist" or similar
    return song.includes('-');
  };

  // Add a warning for songs that might not be properly formatted
  const improperlyFormattedSongs = songs.filter(song => !checkSongFormat(song));

  const handleContinue = () => {
    // If there are improperly formatted songs, show the confirmation dialog
    if (improperlyFormattedSongs.length > 0) {
      setShowConfirmation(true);
    } else {
      // If all songs are properly formatted, continue directly
      onContinue(songs);
    }
  };
  
  // Handle confirmation dialog continue
  const handleConfirmContinue = () => {
    setShowConfirmation(false);
    onContinue(songs);
  };
  
  return (
    <>
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmContinue}
        title="Song Format Warning"
        description={
          <div className="space-y-4">
            {/* No wrapping paragraph to avoid nesting issues */}
            <span className="block">
              {improperlyFormattedSongs.length} songs are not in the recommended "Song - Artist" format. 
              This may affect how well Spotify can find these tracks.
            </span>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-sm">
              <span className="block font-medium text-amber-800 dark:text-amber-300">For best results:</span>
              <ul className="list-disc pl-5 mt-1 text-amber-700 dark:text-amber-400">
                <li>Add artist names separated by a dash</li>
                <li>Example: "Bohemian Rhapsody - Queen"</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Continue Anyway"
        cancelText="Go Back and Edit"
      />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Review Your Songs</CardTitle>
          <CardDescription>
            We extracted {initialSongs.length} songs from your file. 
            You can add, remove, or modify songs before creating your playlist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and add new song */}
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Add a song (e.g. Billie Jean - Michael Jackson)"
                    value={newSong}
                    onChange={(e) => setNewSong(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use format "Song Title - Artist Name" for best Spotify search results
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddSong}
                  disabled={!newSong.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Song list */}
          <div className="border rounded-md p-2">
            <div className="flex justify-between mb-2 px-2">
              <span className="text-sm font-medium">
                {filteredSongs.length} songs
              </span>
              {songs.length !== initialSongs.length && (
                <span className="text-xs text-muted-foreground">
                  {songs.length > initialSongs.length ? 'Added' : 'Removed'} {Math.abs(songs.length - initialSongs.length)} songs
                </span>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song, index) => (
                  <div 
                    key={`${song}-${index}`} 
                    className={`flex items-center justify-between p-2 rounded-md hover:bg-muted group ${!checkSongFormat(song) ? 'border-l-2 border-amber-400' : ''}`}
                  >
                    <span className="text-sm truncate flex-1 flex items-center">
                      {!checkSongFormat(song) && (
                        <span className="mr-2 text-amber-500" title="This song might not search well. Consider adding an artist with a dash (-)">
                          ⚠️
                        </span>
                      )}
                      {song}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteSong(songs.indexOf(song))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-16 text-muted-foreground">
                  {searchTerm ? 'No matching songs found' : 'No songs added yet'}
                </div>
              )}
            </div>
          </div>
          
          {/* Formatting Warning */}
          {improperlyFormattedSongs.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
              <div className="flex items-start">
                <span className="mr-2 text-amber-500">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Formatting Warning</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {improperlyFormattedSongs.length} songs are not in the recommended format. 
                    For best results with Spotify search, use "Song - Artist" format.
                  </p>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium">Examples:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><span className="line-through">Bohemian Rhapsody</span> → <span className="font-medium">Bohemian Rhapsody - Queen</span></li>
                  <li><span className="line-through">The Beatles Hey Jude</span> → <span className="font-medium">Hey Jude - The Beatles</span></li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Stats and counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md p-3 bg-muted/50 flex items-center space-x-3">
              <div className="rounded-full bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Original songs</span>
                <p className="text-lg font-medium">{initialSongs.length}</p>
              </div>
            </div>
            
            <div className="rounded-md p-3 bg-muted/50 flex items-center space-x-3">
              <div className="rounded-full bg-blue-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Final songs</span>
                <p className="text-lg font-medium">{songs.length}</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleContinue} disabled={songs.length === 0}>
              Continue with {songs.length} Songs
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 