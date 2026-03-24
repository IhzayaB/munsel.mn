function ProductSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card animate-pulse">
      <div className="bg-gray-200 aspect-[3/4]" />
      <div className="p-2.5 sm:p-4 space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-1/3" />
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-12">
      {/* Title skeleton */}
      <div className="h-7 sm:h-8 bg-gray-200 rounded w-56 mb-4 sm:mb-6 animate-pulse" />

      {/* Category pills skeleton */}
      <div className="flex gap-2 mb-6 sm:mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-full bg-gray-200 animate-pulse shrink-0"
            style={{ width: `${60 + i * 10}px` }}
          />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
