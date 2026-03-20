function ProductSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card animate-pulse">
      <div className="bg-gray-200 h-64" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Category pills skeleton */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-full bg-gray-200 animate-pulse"
            style={{ width: `${60 + Math.random() * 40}px` }}
          />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
