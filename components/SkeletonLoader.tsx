export function SkeletonCard() {
  return (
    <div className="bg-white rounded shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded shadow overflow-hidden animate-pulse">
      <div className="bg-gray-100 p-4 flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b flex gap-4">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-3 bg-gray-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded shadow p-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded shadow p-4 animate-pulse flex gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonLesson() {
  return (
    <div className="bg-white rounded shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-48 bg-gray-100 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function SkeletonLoader({ type = "card", count = 1, rows = 4 }: {
  type?: "card" | "table" | "stats" | "list" | "text" | "lesson";
  count?: number;
  rows?: number;
}) {
  if (type === "table") return <SkeletonTable rows={rows} />;
  if (type === "stats") return <SkeletonStats count={count} />;
  if (type === "list") return <SkeletonList rows={rows} />;
  if (type === "text") return <SkeletonText lines={rows} />;
  if (type === "lesson") return <SkeletonLesson />;

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}