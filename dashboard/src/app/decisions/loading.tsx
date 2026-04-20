export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-64 bg-gray-200 rounded" />
      <div className="h-12 bg-gray-200 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
