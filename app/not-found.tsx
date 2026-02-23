import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 inline-block"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}