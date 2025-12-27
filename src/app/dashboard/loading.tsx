import { SkeletonStats, SkeletonFarmCard } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="mb-8">
          <SkeletonStats />
        </div>

        {/* Farms grid skeleton */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonFarmCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
