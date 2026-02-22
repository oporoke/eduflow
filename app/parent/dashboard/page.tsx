"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ParentDashboardPage() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    const res = await fetch("/api/parent/children");
    if (res.status === 401) {
      router.push("/parent/login");
      return;
    }
    const data = await res.json();
    setChildren(data);
  };

  const linkChild = async () => {
    if (!studentEmail) return;
    const res = await fetch("/api/parent/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentEmail }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Child linked successfully!");
      setStudentEmail("");
      fetchChildren();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/parent/logout", { method: "POST" });
    router.push("/parent/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Parent Dashboard</h1>
            <p className="text-gray-500 text-sm">Monitor your children's learning progress</p>
          </div>
          <div
            onClick={() => router.push("/parent/meetings")}
            className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold">Meetings</h3>
            <p className="text-gray-500 text-sm mt-1">Schedule and manage meetings with teachers</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Sign Out
          </button>
        </div>

        {/* Link Child */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Link a Child</h2>
          <p className="text-sm text-gray-500 mb-3">
            Enter your child's registered email address to link their account.
          </p>
          {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Child's email address"
              className="flex-1 border p-2 rounded text-sm"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
            <button
              onClick={linkChild}
              className="bg-blue-600 text-white px-4 rounded text-sm hover:bg-blue-700"
            >
              Link Child
            </button>
          </div>
        </div>

        {/* Children List */}
        {children.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">👨‍👧</p>
            <p>No children linked yet. Add your child's email above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/parent/student/${c.student.id}`)}
                className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {c.student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.student.name}</h3>
                    <p className="text-sm text-gray-400">{c.student.email}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mt-4 hover:underline">
                  View Progress →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}