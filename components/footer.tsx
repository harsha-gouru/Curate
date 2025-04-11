export default function Footer() {
  return (
    <footer className="border-t py-5">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Playlist Studio</p>
      </div>
    </footer>
  )
}
