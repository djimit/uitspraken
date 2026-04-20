export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-80 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="h-80 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-lg" />
        <div className="h-80 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
