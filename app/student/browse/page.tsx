"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrowseClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const res = await fetch("/api/classes/available");
    const data = await res.json();
    setClasses(data);
  };

  const handleEnroll = async (classroomId: string) => {
    const res = await fetch(`/api/classes/${classroomId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Enrolled successfully!");
      fetchClasses();
    }
  };

  const handleUnenroll = async (classroomId: string) => {
    const res = await fetch(`/api/classes/${classroomId}/enroll`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      setMessage("Unenrolled successfully");
      fetchClasses();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Browse Classes</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {classes.length === 0 ? (
          <p className="text-gray-500">No classes available.</p>
        ) : (
          <div className="space-y-4">
            {classes.map((c) => (
              <div key={c.id} className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{c.name}</h2>
                    {c.description && <p className="text-gray-500 text-sm mt-1">{c.description}</p>}
                    <p className="text-sm text-gray-600 mt-2">Teacher: {c.teacher?.name}</p>
                    <p className="text-sm text-gray-600">Students: {c.enrollments?.length}</p>
                  </div>
                  <div>
                    {c.isEnrolled ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Enrolled
                        </span>
                        <button
                          onClick={() => handleUnenroll(c.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Unenroll
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}