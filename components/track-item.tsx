"use client"

import type { Track } from "@/types/music"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TrackItemProps {
  track: Track
  onRemove: (id: string) => void
}

export default function TrackItem({ track, onRemove }: TrackItemProps) {
  return (
    <div className="flex items-center space-x-4 p-2 hover:bg-accent/5 rounded-md">
      <div className="h-16 w-16 bg-muted rounded flex-shrink-0">
        {track.artwork && (
          <img
            src={track.artwork || "/placeholder.svg"}
            alt={track.name}
            className="h-full w-full object-cover rounded"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{track.name}</h4>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        {track.album && <p className="text-xs text-muted-foreground truncate">{track.album}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(track.id)} className="flex-shrink-0">
        <X className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
    </div>
  )
}
