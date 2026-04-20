export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-lg" />
        <div className="h-80 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-96 bg-gray-200 rounded-lg" />
    </div>
  );
}
