export default function Loading() {
  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <div className="h-16 border-b bg-background" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-7 lg:py-9">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 max-w-xl animate-pulse rounded bg-muted" />
        <div className="h-5 max-w-2xl animate-pulse rounded bg-muted" />
        <div className="grid gap-4 pt-4 md:grid-cols-3">
          <div className="h-44 animate-pulse rounded-xl border bg-card" />
          <div className="h-44 animate-pulse rounded-xl border bg-card" />
          <div className="h-44 animate-pulse rounded-xl border bg-card" />
        </div>
      </main>
    </div>
  );
}
