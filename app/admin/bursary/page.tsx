"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-600",
  APPROVED: "bg-green-100 text-green-600",
  REJECTED: "bg-red-100 text-red-600",
};

export default function BursaryPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", totalFunds: "", source: "", academicYear: "", deadline: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const res = await fetch("/api/bursary");
    const data = await res.json();
    setPrograms(data);
  };

  const createProgram = async () => {
    if (!form.name || !form.totalFunds || !form.source || !form.academicYear) return;
    const res = await fetch("/api/bursary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "program", ...form }),
    });
    if (res.ok) {
      setMessage("Program created!");
      setShowForm(false);
      setForm({ name: "", description: "", totalFunds: "", source: "", academicYear: "", deadline: "" });
      fetchPrograms();
    }
  };

  const reviewApplication = async (applicationId: string, status: string) => {
    await fetch("/api/bursary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    setMessage(`Application ${status.toLowerCase()}!`);
    fetchPrograms();
    if (selectedProgram) {
      const updated = programs.find((p) => p.id === selectedProgram.id);
      setSelectedProgram(updated);
    }
  };

  const totalFunds = programs.reduce((acc, p) => acc + p.totalFunds, 0);
  const totalUsed = programs.reduce((acc, p) => acc + p.usedFunds, 0);
  const pendingCount = programs.reduce(
    (acc, p) => acc + p.applications.filter((a: any) => a.status === "PENDING").length, 0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bursary & Scholarships</h1>
            <p className="text-gray-500 text-sm">Manage student financial assistance programs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Program
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{programs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Programs</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">KES {totalFunds.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total Funds</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">KES {totalUsed.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Disbursed</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Review</p>
          </div>
        </div>

        {/* Create Program Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Bursary Program</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Program name" className="border p-2 rounded text-sm"
                value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input type="text" placeholder="Source (e.g. CDF, Government, NGO)" className="border p-2 rounded text-sm"
                value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} />
              <input type="number" placeholder="Total Funds (KES)" className="border p-2 rounded text-sm"
                value={form.totalFunds} onChange={(e) => setForm((p) => ({ ...p, totalFunds: e.target.value }))} />
              <input type="text" placeholder="Academic Year (e.g. 2025)" className="border p-2 rounded text-sm"
                value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} />
              <input type="date" placeholder="Application Deadline" className="border p-2 rounded text-sm"
                value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
              <textarea placeholder="Description (optional)" className="border p-2 rounded text-sm col-span-2 h-16 resize-none"
                value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <button onClick={createProgram} className="mt-3 bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              Create Program
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Programs List */}
          <div className="col-span-1 space-y-3">
            {programs.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">🎓</p>
                <p className="text-sm">No programs yet</p>
              </div>
            ) : (
              programs.map((program) => {
                const percentage = Math.round((program.usedFunds / program.totalFunds) * 100);
                const pending = program.applications.filter((a: any) => a.status === "PENDING").length;
                return (
                  <div
                    key={program.id}
                    onClick={() => setSelectedProgram(program)}
                    className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                      selectedProgram?.id === program.id ? "border-blue-500" : "border-transparent"
                    }`}
                  >
                    <h3 className="font-semibold text-sm">{program.name}</h3>
                    <p className="text-xs text-gray-400">{program.source} · {program.academicYear}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>KES {program.usedFunds.toLocaleString()} used</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${percentage >= 90 ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    {pending > 0 && (
                      <p className="text-xs text-orange-600 mt-2">{pending} pending applications</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Applications Panel */}
          <div className="col-span-2">
            {!selectedProgram ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select a program to review applications</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{selectedProgram.name}</h2>
                  <p className="text-sm text-gray-500">{selectedProgram.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Total: KES {selectedProgram.totalFunds.toLocaleString()}</span>
                    <span>Used: KES {selectedProgram.usedFunds.toLocaleString()}</span>
                    <span>Remaining: KES {(selectedProgram.totalFunds - selectedProgram.usedFunds).toLocaleString()}</span>
                  </div>
                  {selectedProgram.deadline && (
                    <p className="text-sm text-gray-500">
                      Deadline: {new Date(selectedProgram.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <h3 className="font-semibold text-sm mb-3">
                  Applications ({selectedProgram.applications.length})
                </h3>

                {selectedProgram.applications.length === 0 ? (
                  <p className="text-gray-400 text-sm">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedProgram.applications.map((app: any) => (
                      <div key={app.id} className="border rounded p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{app.student?.name}</p>
                            <p className="text-xs text-gray-400">{app.student?.email}</p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">
                              KES {app.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{app.reason}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[app.status]}`}>
                              {app.status}
                            </span>
                            {app.status === "PENDING" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => reviewApplication(app.id, "APPROVED")}
                                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => reviewApplication(app.id, "REJECTED")}
                                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}