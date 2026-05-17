export function SkeletonCard() {
  return (
    <div className="card space-y-3 animate-pulse">
      <div className="h-5 bg-surface-soft rounded w-3/4" />
      <div className="h-3 bg-surface-soft rounded w-1/2" />
      <div className="h-3 bg-surface-soft rounded w-2/3" />
    </div>
  )
}

export function SkeletonLine({ width = '100%', className = '' }: { width?: string; className?: string }) {
  return <div className={`h-4 bg-surface-soft rounded animate-pulse ${className}`} style={{ width }} />
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-surface-soft rounded-xl animate-pulse ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-surface-soft rounded w-48 animate-pulse" />
        <div className="h-10 bg-surface-soft rounded w-36 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
