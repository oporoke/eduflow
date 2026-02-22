export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-8">
        <p className="text-6xl mb-4">📴</p>
        <h1 className="text-2xl font-bold mb-2">You are offline</h1>
        <p className="text-gray-500 mb-6">
          No internet connection. Previously visited pages are still available.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}