"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Salaries", "Infrastructure", "Learning Materials", "ICT Equipment", "Sports & Co-curricular", "Utilities", "Maintenance", "Events", "Bursary", "Other"];

const STATUS_COLORS: { [key: string]: string } = {
  DRAFT: "bg-yellow-100 text-yellow-600",
  APPROVED: "bg-green-100 text-green-600",
  CLOSED: "bg-gray-100 text-gray-600",
};

export default function BudgetPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", academicYear: "", totalAmount: "" });
  const [items, setItems] = useState([{ category: "Salaries", description: "", planned: "", actual: "0" }]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    const res = await fetch("/api/budget");
    const data = await res.json();
    setBudgets(data);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { category: "Salaries", description: "", planned: "", actual: "0" }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const createBudget = async () => {
    if (!form.title || !form.academicYear || !form.totalAmount) return;
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    if (res.ok) {
      setMessage("Budget created!");
      setShowForm(false);
      setForm({ title: "", academicYear: "", totalAmount: "" });
      setItems([{ category: "Salaries", description: "", planned: "", actual: "0" }]);
      fetchBudgets();
    }
  };

  const updateActual = async (itemId: string, actual: string) => {
    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, actual }),
    });
    fetchBudgets();
    if (selected) {
      const updated = await fetch("/api/budget");
      const data = await updated.json();
      const updatedBudget = data.find((b: any) => b.id === selected.id);
      setSelected(updatedBudget);
    }
  };

  const updateStatus = async (budgetId: string, status: string) => {
    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetId, status }),
    });
    setMessage(`Budget ${status.toLowerCase()}!`);
    fetchBudgets();
  };

  const totalPlanned = selected?.items?.reduce((acc: number, i: any) => acc + i.planned, 0) || 0;
  const totalActual = selected?.items?.reduce((acc: number, i: any) => acc + i.actual, 0) || 0;
  const variance = totalPlanned - totalActual;

  const groupedItems = selected?.items?.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Budget Planning</h1>
            <p className="text-gray-500 text-sm">Plan and track school financial budgets</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Budget
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Create Budget Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Budget</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <input type="text" placeholder="Budget title" className="border p-2 rounded text-sm"
                value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <input type="text" placeholder="Academic year (e.g. 2025)" className="border p-2 rounded text-sm"
                value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} />
              <input type="number" placeholder="Total budget (KES)" className="border p-2 rounded text-sm"
                value={form.totalAmount} onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))} />
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm">Budget Items</h3>
                <button onClick={addItem} className="text-blue-600 text-xs hover:underline">+ Add Item</button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-center">
                    <select className="border p-2 rounded text-sm"
                      value={item.category} onChange={(e) => updateItem(index, "category", e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" placeholder="Description" className="border p-2 rounded text-sm"
                      value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                    <input type="number" placeholder="Planned (KES)" className="border p-2 rounded text-sm"
                      value={item.planned} onChange={(e) => updateItem(index, "planned", e.target.value)} />
                    <button onClick={() => removeItem(index)} className="text-red-400 text-xs hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={createBudget} className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              Create Budget
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Budget List */}
          <div className="col-span-1 space-y-3">
            {budgets.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">💰</p>
                <p className="text-sm">No budgets yet</p>
              </div>
            ) : (
              budgets.map((budget) => {
                const planned = budget.items.reduce((acc: number, i: any) => acc + i.planned, 0);
                const actual = budget.items.reduce((acc: number, i: any) => acc + i.actual, 0);
                const pct = planned ? Math.round((actual / planned) * 100) : 0;
                return (
                  <div
                    key={budget.id}
                    onClick={() => setSelected(budget)}
                    className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                      selected?.id === budget.id ? "border-blue-500" : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm">{budget.title}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[budget.status]}`}>
                        {budget.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{budget.academicYear}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>KES {actual.toLocaleString()} spent</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Budget Detail */}
          <div className="col-span-2">
            {!selected ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📊</p>
                <p>Select a budget to view details</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.title}</h2>
                    <p className="text-sm text-gray-500">{selected.academicYear} · By {selected.createdBy?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === "DRAFT" && (
                      <button
                        onClick={() => updateStatus(selected.id, "APPROVED")}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                    {selected.status === "APPROVED" && (
                      <button
                        onClick={() => updateStatus(selected.id, "CLOSED")}
                        className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded p-3 text-center">
                    <p className="text-lg font-bold text-blue-600">KES {totalPlanned.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Planned</p>
                  </div>
                  <div className="bg-orange-50 rounded p-3 text-center">
                    <p className="text-lg font-bold text-orange-600">KES {totalActual.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Actual</p>
                  </div>
                  <div className={`rounded p-3 text-center ${variance >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    <p className={`text-lg font-bold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      KES {Math.abs(variance).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{variance >= 0 ? "Under Budget" : "Over Budget"}</p>
                  </div>
                </div>

                {/* Items by Category */}
                <div className="space-y-4">
                  {Object.entries(groupedItems || {}).map(([category, categoryItems]: [string, any]) => (
                    <div key={category}>
                      <h3 className="font-medium text-sm text-gray-600 mb-2">{category}</h3>
                      <div className="space-y-2">
                        {categoryItems.map((item: any) => (
                          <div key={item.id} className="border rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm">{item.description || category}</p>
                              <div className="flex gap-3 text-sm">
                                <span className="text-gray-500">
                                  Planned: KES {item.planned.toLocaleString()}
                                </span>
                                <span className={item.actual > item.planned ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                  Actual: KES {item.actual.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {selected.status !== "CLOSED" && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500">Update actual:</label>
                                <input
                                  type="number"
                                  defaultValue={item.actual}
                                  className="border p-1 rounded text-xs w-32"
                                  onBlur={(e) => updateActual(item.id, e.target.value)}
                                />
                              </div>
                            )}
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${item.actual > item.planned ? "bg-red-500" : "bg-blue-500"}`}
                                style={{ width: `${Math.min((item.actual / item.planned) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}