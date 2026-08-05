
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-8xl font-bold text-destructive">404</h1>
        <h2 className="text-3xl font-semibold tracking-tight">
          Seite nicht gefunden
        </h2>
        <p className="text-muted-foreground">Die von Ihnen gesuchte Seite konnte nicht gefunden werden.</p>
      </div>
    </div>
  )
}
