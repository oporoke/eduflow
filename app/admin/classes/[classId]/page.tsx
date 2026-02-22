"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ManageClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if ((session?.user as any)?.role !== "ADMIN") router.push("/dashboard");
    fetchClass();
    fetchStudents();
  }, [session]);

  const fetchClass = async () => {
    const res = await fetch(`/api/classes/${classId}`);
    const data = await res.json();
    setClassData(data);
  };

  const fetchStudents = async () => {
    const res = await fetch("/api/users?role=STUDENT");
    const data = await res.json();
    setStudents(data);
  };

  const handleEnroll = async () => {
    if (!selectedStudent) return;
    const res = await fetch(`/api/classes/${classId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedStudent }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Student enrolled successfully");
      setSelectedStudent("");
      fetchClass();
    }
  };

  const handleUnenroll = async (studentId: string) => {
    const res = await fetch(`/api/classes/${classId}/enroll`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });

    if (res.ok) {
      setMessage("Student unenrolled");
      fetchClass();
    }
  };

  if (!classData) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <button onClick={() => router.push("/admin/classes")} className="text-sm text-blue-600 hover:underline">
            Back to Classes
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Enroll Student</h2>
          <div className="flex gap-2">
            <select
              className="flex-1 border p-2 rounded"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleEnroll}
              className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
            >
              Enroll
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Enrolled Students</h2>
          {classData.enrollments?.length === 0 ? (
            <p className="text-gray-500">No students enrolled yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classData.enrollments?.map((e: any) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2">{e.student?.name}</td>
                    <td className="py-2">{e.student?.email}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleUnenroll(e.student?.id)}
                        className="text-red-500 hover:underline"
                      >
                        Unenroll
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
