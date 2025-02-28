export default function PaymentsLoading() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 