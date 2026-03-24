export default function Loading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 animate-pulse">
      {/* Breadcrumbs skeleton */}
      <div className="h-4 bg-gray-200 rounded w-56 mb-4 sm:mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Image skeleton */}
        <div>
          <div className="aspect-square bg-gray-200 rounded-lg sm:rounded-xl mb-3" />
          <div className="hidden lg:flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-9 bg-gray-200 rounded w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 w-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-px bg-gray-200 my-6" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
