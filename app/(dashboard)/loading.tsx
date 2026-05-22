export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy aria-label="Loading">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 rounded-md" />
        <div className="bg-muted h-4 w-32 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted/50 h-24 rounded-xl border" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-muted/50 h-80 rounded-xl border" />
        <div className="bg-muted/50 h-80 rounded-xl border" />
      </div>
    </div>
  );
}
