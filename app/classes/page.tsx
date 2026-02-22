"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ClassesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const role = (session?.user as any)?.role;

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Classes</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </button>
        </div>

        {classes.length === 0 ? (
          <p className="text-gray-500">No classes found.</p>
        ) : (
          <div className="space-y-4">
            {classes.map((c) => (
              <div key={c.id} className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                {c.description && <p className="text-gray-500 text-sm mt-1">{c.description}</p>}
                <p className="text-sm text-gray-600 mt-2">Teacher: {c.teacher?.name}</p>
                <p className="text-sm text-gray-600">Students: {c.enrollments?.length}</p>
                <div className="flex gap-2 mt-3">
                  {role === "TEACHER" && (
                    <button
                      onClick={() => router.push(`/teacher/curriculum/${c.id}`)}
                      className="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Manage Curriculum
                    </button>
                  )}
                  {role === "STUDENT" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => router.push(`/student/classes/${c.id}`)}
                        className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        View Curriculum
                      </button>
                      <button
                        onClick={() => router.push(`/student/live/${c.id}`)}
                        className="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                      >
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block"></span>
                        Join Live
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
