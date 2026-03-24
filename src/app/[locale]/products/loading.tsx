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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumbs skeleton */}
      <div className="h-4 bg-gray-200 rounded w-40 mb-4 sm:mb-6 animate-pulse" />

      {/* Title + count skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-11 bg-gray-200 rounded-lg flex-1" />
          <div className="h-11 bg-gray-200 rounded-lg flex-1" />
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
