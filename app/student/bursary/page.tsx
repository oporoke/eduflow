"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-600",
  APPROVED: "bg-green-100 text-green-600",
  REJECTED: "bg-red-100 text-red-600",
};

export default function StudentBursaryPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const res = await fetch("/api/bursary");
    const data = await res.json();
    setPrograms(data);
  };

  const applyForBursary = async (programId: string) => {
    if (!amount || !reason) return setError("Amount and reason required");
    const res = await fetch("/api/bursary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "application", programId, amount, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Application submitted successfully!");
      setSelectedProgram(null);
      setAmount("");
      setReason("");
      setError("");
      fetchPrograms();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bursary & Scholarships</h1>
            <p className="text-gray-500 text-sm">Apply for financial assistance programs</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {programs.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">🎓</p>
            <p>No active bursary programs at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => {
              const myApplication = program.applications?.[0];
              const remaining = program.totalFunds - program.usedFunds;
              return (
                <div key={program.id} className="bg-white rounded shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      <p className="text-sm text-gray-500">{program.source} · {program.academicYear}</p>
                      {program.description && (
                        <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                      )}
                    </div>
                    {myApplication ? (
                      <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[myApplication.status]}`}>
                        {myApplication.status}
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                        Open
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 text-sm text-gray-500 mb-3">
                    <span>Available: KES {remaining.toLocaleString()}</span>
                    {program.deadline && (
                      <span>Deadline: {new Date(program.deadline).toLocaleDateString()}</span>
                    )}
                  </div>

                  {myApplication ? (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm font-medium">Your Application</p>
                      <p className="text-sm text-blue-600 font-bold">
                        KES {myApplication.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">{myApplication.reason}</p>
                      {myApplication.reviewNote && (
                        <p className="text-xs text-gray-500 mt-1">
                          Note: {myApplication.reviewNote}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {selectedProgram?.id === program.id ? (
                        <div className="border-t pt-4 space-y-3">
                          {error && <p className="text-red-500 text-sm">{error}</p>}
                          <input
                            type="number"
                            placeholder="Amount requested (KES)"
                            className="w-full border p-2 rounded text-sm"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                          <textarea
                            placeholder="Reason for application — explain your financial need..."
                            className="w-full border p-2 rounded text-sm h-24 resize-none"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => applyForBursary(program.id)}
                              className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                            >
                              Submit Application
                            </button>
                            <button
                              onClick={() => setSelectedProgram(null)}
                              className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedProgram(program)}
                          className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          Apply Now
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}