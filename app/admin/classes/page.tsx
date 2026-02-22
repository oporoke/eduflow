"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminClassesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ((session?.user as any)?.role !== "ADMIN") router.push("/dashboard");
    fetchClasses();
    fetchTeachers();
  }, [session]);

  const fetchClasses = async () => {
  try {
    const res = await fetch("/api/classes");
    const text = await res.text();
    console.log("Raw response:", text);
    const data = JSON.parse(text);
    setClasses(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("fetchClasses error:", err);
  }
};

  const fetchTeachers = async () => {
    const res = await fetch("/api/users?role=TEACHER");
    const data = await res.json();
    setTeachers(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, teacherId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Class created successfully");
      setName("");
      setDescription("");
      setTeacherId("");
      fetchClasses();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Classes</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </button>
        </div>

        {/* Create Class Form */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Class</h2>
          {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Class Name"
              className="w-full border p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              className="w-full border p-2 rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <select
              className="w-full border p-2 rounded"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Create Class
            </button>
          </form>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">All Classes</h2>
          {classes.length === 0 ? (
            <p className="text-gray-500">No classes yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Teacher</th>
                  <th className="pb-2">Students</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2">{c.teacher?.name}</td>
                    <td className="py-2">{c.enrollments?.length}</td>
                    <td className="py-2">
                      <button
                        onClick={() => router.push(`/admin/classes/${c.id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
