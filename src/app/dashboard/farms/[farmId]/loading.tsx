import { Skeleton, SkeletonStats, SkeletonActivityCard } from '@/components/ui/Skeleton'

export default function FarmDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>

        {/* Farm header skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mb-6">
          <SkeletonStats />
        </div>

        {/* Tabs skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab headers */}
          <div className="flex border-b border-gray-100 p-2 gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>

          {/* Tab content */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonActivityCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
