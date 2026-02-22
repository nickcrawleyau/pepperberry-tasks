export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header skeleton */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-stone-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-stone-100 rounded animate-pulse mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 w-14 bg-stone-100 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {/* Action bar skeleton */}
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-28 bg-stone-200 rounded-lg animate-pulse" />
          <div className="h-9 w-20 bg-stone-100 rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="h-3 w-16 bg-stone-100 rounded animate-pulse mb-2" />
              <div className="h-6 w-8 bg-stone-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Task count skeleton */}
        <div className="h-4 w-24 bg-stone-100 rounded animate-pulse mb-4" />

        {/* Filter tabs skeleton */}
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 flex-1 bg-stone-200 rounded-md animate-pulse" />
          ))}
        </div>

        {/* Task card skeletons */}
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="h-4 w-48 bg-stone-200 rounded animate-pulse" />
                <div className="h-5 w-14 bg-stone-100 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-full bg-stone-100 rounded animate-pulse mb-2" />
              <div className="h-3 w-2/3 bg-stone-100 rounded animate-pulse mb-3" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-stone-100 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-stone-100 rounded-full animate-pulse" />
                <div className="h-5 w-14 bg-stone-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
