"use client"

import Link from "next/link"
import { ModeToggle } from "./mode-toggle"

export default function Header() {
  return (
    <header className="border-b py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-lg font-medium">
          Playlist Studio
        </Link>
        <ModeToggle />
      </div>
    </header>
  )
}
