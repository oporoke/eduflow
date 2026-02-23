"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TERMS = ["Term 1", "Term 2", "Term 3"];

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-600",
  COMPLETED: "bg-green-100 text-green-600",
  FAILED: "bg-red-100 text-red-600",
};

export default function FeesPage() {
  const router = useRouter();
  const [fees, setFees] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("structures");
  const [form, setForm] = useState({
    classroomId: "", term: "Term 1", academicYear: "2025",
    totalAmount: "", description: "", dueDate: "",
  });
  const [items, setItems] = useState([{ name: "", amount: "" }]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [feesRes, classesRes] = await Promise.all([
      fetch("/api/fees"),
      fetch("/api/classes"),
    ]);
    const feesData = await feesRes.json();
    const classesData = await classesRes.json();
    setFees(feesData);
    setClassrooms(classesData);
    if (selected) {
      const updated = feesData.find((f: any) => f.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  const createFeeStructure = async () => {
    if (!form.classroomId || !form.totalAmount) return;
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    if (res.ok) {
      setMessage("Fee structure created!");
      setShowForm(false);
      setForm({ classroomId: "", term: "Term 1", academicYear: "2025", totalAmount: "", description: "", dueDate: "" });
      setItems([{ name: "", amount: "" }]);
      fetchData();
    }
  };

  const deleteFeeStructure = async (id: string) => {
    if (!confirm("Delete this fee structure?")) return;
    await fetch(`/api/fees?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // Stats
  const totalExpected = fees.reduce((acc, f) => {
    const students = [...new Set(f.feePayments?.map((p: any) => p.studentId))].length;
    return acc + f.totalAmount * students;
  }, 0);

  const totalCollected = fees.reduce((acc, f) =>
    acc + f.feePayments?.filter((p: any) => p.status === "COMPLETED")
      .reduce((sum: number, p: any) => sum + p.amount, 0), 0);

  const allPayments = fees.flatMap((f) => f.feePayments?.map((p: any) => ({ ...p, feeName: `${f.term} ${f.academicYear}`, className: f.classroom?.name })) || []);
  const pendingPayments = allPayments.filter((p) => p.status === "PENDING");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Fee Management</h1>
            <p className="text-gray-500 text-sm">Set fee structures and track M-Pesa payments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Fee Structure
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
            <p className="text-2xl font-bold text-blue-600">{fees.length}</p>
            <p className="text-xs text-gray-500 mt-1">Fee Structures</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              KES {totalCollected.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Collected</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingPayments.length}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Payments</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {allPayments.filter((p) => p.status === "COMPLETED").length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Completed Payments</p>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Fee Structure</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Class</label>
                <select className="w-full border p-2 rounded text-sm"
                  value={form.classroomId} onChange={(e) => setForm((p) => ({ ...p, classroomId: e.target.value }))}>
                  <option value="">Select class</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Term</label>
                <select className="w-full border p-2 rounded text-sm"
                  value={form.term} onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}>
                  {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Academic Year</label>
                <input type="text" className="w-full border p-2 rounded text-sm"
                  value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Total Amount (KES)</label>
                <input type="number" className="w-full border p-2 rounded text-sm"
                  value={form.totalAmount} onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <input type="date" className="w-full border p-2 rounded text-sm"
                  value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <input type="text" placeholder="e.g. Includes tuition and lunch" className="w-full border p-2 rounded text-sm"
                  value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm">Fee Breakdown</h3>
                <button
                  onClick={() => setItems((p) => [...p, { name: "", amount: "" }])}
                  className="text-blue-600 text-xs hover:underline"
                >
                  + Add Item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder="Item name (e.g. Tuition)" className="flex-1 border p-2 rounded text-sm"
                      value={item.name} onChange={(e) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))} />
                    <input type="number" placeholder="Amount" className="w-32 border p-2 rounded text-sm"
                      value={item.amount} onChange={(e) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, amount: e.target.value } : it))} />
                    <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="text-red-400 text-xs hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={createFeeStructure} className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              Create Fee Structure
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["structures", "payments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm capitalize border ${
                activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab === "structures" ? "📋 Fee Structures" : `💳 All Payments (${allPayments.length})`}
            </button>
          ))}
        </div>

        {/* Fee Structures Tab */}
        {activeTab === "structures" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-3">
              {fees.length === 0 ? (
                <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                  <p className="text-3xl mb-2">💰</p>
                  <p className="text-sm">No fee structures yet</p>
                </div>
              ) : (
                fees.map((fee) => {
                  const collected = fee.feePayments?.filter((p: any) => p.status === "COMPLETED")
                    .reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
                  return (
                    <div
                      key={fee.id}
                      onClick={() => setSelected(fee)}
                      className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                        selected?.id === fee.id ? "border-blue-500" : "border-transparent"
                      }`}
                    >
                      <h3 className="font-semibold text-sm">{fee.term} {fee.academicYear}</h3>
                      <p className="text-xs text-gray-400">{fee.classroom?.name}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">
                        KES {fee.totalAmount.toLocaleString()}
                      </p>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Collected: KES {collected.toLocaleString()}</span>
                        <span>{fee.feePayments?.length} payments</span>
                      </div>
                      {fee.dueDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Due: {new Date(fee.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="col-span-2">
              {!selected ? (
                <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                  <p className="text-4xl mb-3">💳</p>
                  <p>Select a fee structure to view payment details</p>
                </div>
              ) : (
                <div className="bg-white rounded shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">{selected.term} {selected.academicYear}</h2>
                      <p className="text-sm text-gray-500">{selected.classroom?.name}</p>
                      {selected.description && <p className="text-sm text-gray-500">{selected.description}</p>}
                    </div>
                    <button
                      onClick={() => deleteFeeStructure(selected.id)}
                      className="text-red-400 text-xs hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Fee Items */}
                  {selected.feeItems?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-sm mb-2">Fee Breakdown</h3>
                      <div className="space-y-1">
                        {selected.feeItems.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                            <span>{item.name}</span>
                            <span className="font-medium">KES {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold border-t pt-2 px-3">
                          <span>Total</span>
                          <span>KES {selected.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payments */}
                  <h3 className="font-medium text-sm mb-3">
                    Payments ({selected.feePayments?.length})
                  </h3>
                  {selected.feePayments?.length === 0 ? (
                    <p className="text-gray-400 text-sm">No payments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.feePayments?.map((payment: any) => (
                        <div key={payment.id} className="border rounded p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{payment.student?.name}</p>
                            <p className="text-xs text-gray-400">{payment.phone}</p>
                            {payment.mpesaCode && (
                              <p className="text-xs text-green-600 font-medium">{payment.mpesaCode}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">KES {payment.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[payment.status]}`}>
                              {payment.status}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Payments Tab */}
        {activeTab === "payments" && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Class</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Fee Period</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">M-Pesa Code</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">No payments yet</td>
                  </tr>
                ) : (
                  allPayments.map((payment: any) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium">{payment.student?.name}</td>
                      <td className="p-4 text-sm text-gray-500">{payment.className}</td>
                      <td className="p-4 text-sm text-gray-500">{payment.feeName}</td>
                      <td className="p-4 text-sm font-bold">KES {payment.amount.toLocaleString()}</td>
                      <td className="p-4 text-sm text-green-600 font-medium">{payment.mpesaCode || "—"}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-400">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}