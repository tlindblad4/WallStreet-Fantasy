export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="h-8 bg-zinc-800 rounded w-1/3" />
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800 rounded-xl" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="h-64 bg-zinc-800 rounded-xl" />
      
      {/* List skeleton */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
      
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-zinc-800/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
