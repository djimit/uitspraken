export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}
