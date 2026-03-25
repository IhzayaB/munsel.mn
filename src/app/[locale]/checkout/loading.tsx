export default function Loading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumbs skeleton */}
      <div className="h-4 bg-gray-200 rounded w-40 mb-4 sm:mb-6 animate-pulse" />

      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-48 mb-6 sm:mb-8 animate-pulse" />

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left: Form skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-11 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Right: Order summary skeleton */}
        <div className="animate-pulse">
          <div className="border border-border rounded-xl p-4 sm:p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded w-28" />
              </div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
