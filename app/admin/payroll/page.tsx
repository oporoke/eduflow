"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_COLORS: { [key: string]: string } = {
  DRAFT: "bg-yellow-100 text-yellow-600",
  PROCESSED: "bg-green-100 text-green-600",
  PAID: "bg-blue-100 text-blue-600",
};

export default function PayrollPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPayslipForm, setShowPayslipForm] = useState(false);
  const [periodForm, setPeriodForm] = useState({ month: "January", year: new Date().getFullYear().toString() });
  const [payslipForm, setPayslipForm] = useState({ staffId: "", basicSalary: "", allowances: "", deductions: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [periodsRes, staffRes] = await Promise.all([
      fetch("/api/payroll"),
      fetch("/api/users?role=TEACHER"),
    ]);
    const periodsData = await periodsRes.json();
    const staffData = await staffRes.json();
    setPeriods(periodsData);
    setStaff(staffData);
  };

  const createPeriod = async () => {
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(periodForm),
    });
    if (res.ok) {
      setMessage("Payroll period created!");
      setShowForm(false);
      fetchData();
    }
  };

  const addPayslip = async () => {
    if (!payslipForm.staffId || !payslipForm.basicSalary) return;
    await fetch("/api/payroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "addPayslip", periodId: selected.id, ...payslipForm }),
    });
    setMessage("Payslip added!");
    setShowPayslipForm(false);
    setPayslipForm({ staffId: "", basicSalary: "", allowances: "", deductions: "" });
    fetchData();
    refreshSelected();
  };

  const processPayroll = async () => {
    if (!confirm("Process payroll for all staff? This will mark all payslips as PAID.")) return;
    await fetch("/api/payroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "updateStatus", periodId: selected.id, status: "PROCESSED" }),
    });
    setMessage("Payroll processed!");
    fetchData();
    refreshSelected();
  };

  const refreshSelected = async () => {
    const res = await fetch("/api/payroll");
    const data = await res.json();
    setPeriods(data);
    const updated = data.find((p: any) => p.id === selected?.id);
    if (updated) setSelected(updated);
  };

  const totalNetSalary = selected?.payslips?.reduce((acc: number, p: any) => acc + p.netSalary, 0) || 0;
  const totalGross = selected?.payslips?.reduce((acc: number, p: any) => acc + p.basicSalary + p.allowances, 0) || 0;
  const totalPAYE = selected?.payslips?.reduce((acc: number, p: any) => acc + p.paye, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payroll Management</h1>
            <p className="text-gray-500 text-sm">Process teacher salaries with Kenya tax calculations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Period
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Create Period Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Payroll Period</h2>
            <div className="flex gap-3">
              <select
                className="border p-2 rounded text-sm"
                value={periodForm.month}
                onChange={(e) => setPeriodForm((p) => ({ ...p, month: e.target.value }))}
              >
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="text"
                placeholder="Year"
                className="border p-2 rounded text-sm w-24"
                value={periodForm.year}
                onChange={(e) => setPeriodForm((p) => ({ ...p, year: e.target.value }))}
              />
              <button
                onClick={createPeriod}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Periods List */}
          <div className="col-span-1 space-y-3">
            {periods.length === 0 ? (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">💵</p>
                <p className="text-sm">No payroll periods yet</p>
              </div>
            ) : (
              periods.map((period) => {
                const total = period.payslips?.reduce((acc: number, p: any) => acc + p.netSalary, 0) || 0;
                return (
                  <div
                    key={period.id}
                    onClick={() => setSelected(period)}
                    className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                      selected?.id === period.id ? "border-blue-500" : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-sm">{period.month} {period.year}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[period.status]}`}>
                        {period.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {period.payslips?.length} payslips · KES {total.toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Payroll Detail */}
          <div className="col-span-2">
            {!selected ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">💰</p>
                <p>Select a payroll period to manage payslips</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">{selected.month} {selected.year}</h2>
                  <div className="flex gap-2">
                    {selected.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => setShowPayslipForm(!showPayslipForm)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                        >
                          + Add Payslip
                        </button>
                        <button
                          onClick={processPayroll}
                          className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
                        >
                          Process Payroll
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded p-3 text-center">
                    <p className="text-lg font-bold text-blue-600">KES {totalGross.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Gross Salary</p>
                  </div>
                  <div className="bg-red-50 rounded p-3 text-center">
                    <p className="text-lg font-bold text-red-600">KES {totalPAYE.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total PAYE</p>
                  </div>
                  <div className="bg-green-50 rounded p-3 text-center">
                    <p className="text-lg font-bold text-green-600">KES {totalNetSalary.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Net Payroll</p>
                  </div>
                </div>

                {/* Add Payslip Form */}
                {showPayslipForm && (
                  <div className="border rounded p-4 mb-4 bg-gray-50">
                    <h3 className="font-medium text-sm mb-3">Add Payslip</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Staff Member</label>
                        <select
                          className="w-full border p-2 rounded text-sm"
                          value={payslipForm.staffId}
                          onChange={(e) => setPayslipForm((p) => ({ ...p, staffId: e.target.value }))}
                        >
                          <option value="">Select staff</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Basic Salary (KES)</label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded text-sm"
                          value={payslipForm.basicSalary}
                          onChange={(e) => setPayslipForm((p) => ({ ...p, basicSalary: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Allowances (KES)</label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded text-sm"
                          value={payslipForm.allowances}
                          onChange={(e) => setPayslipForm((p) => ({ ...p, allowances: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Other Deductions (KES)</label>
                        <input
                          type="number"
                          className="w-full border p-2 rounded text-sm"
                          value={payslipForm.deductions}
                          onChange={(e) => setPayslipForm((p) => ({ ...p, deductions: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button
                      onClick={addPayslip}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Add Payslip
                    </button>
                  </div>
                )}

                {/* Payslips */}
                {selected.payslips?.length === 0 ? (
                  <p className="text-gray-400 text-sm">No payslips yet</p>
                ) : (
                  <div className="space-y-3">
                    {selected.payslips?.map((payslip: any) => (
                      <div key={payslip.id} className="border rounded p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">{payslip.staff?.name}</p>
                            <p className="text-xs text-gray-400">{payslip.staff?.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[payslip.status]}`}>
                            {payslip.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-500">Basic</p>
                            <p className="font-medium">KES {payslip.basicSalary.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-500">Allowances</p>
                            <p className="font-medium">KES {payslip.allowances.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-500">Gross</p>
                            <p className="font-medium">KES {(payslip.basicSalary + payslip.allowances).toLocaleString()}</p>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <p className="text-gray-500">PAYE</p>
                            <p className="font-medium text-red-600">KES {payslip.paye.toLocaleString()}</p>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <p className="text-gray-500">NHIF</p>
                            <p className="font-medium text-red-600">KES {payslip.nhif.toLocaleString()}</p>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <p className="text-gray-500">NSSF</p>
                            <p className="font-medium text-red-600">KES {payslip.nssf.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <p className="text-sm font-bold text-green-600">
                            Net: KES {payslip.netSalary.toLocaleString()}
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
      </div>
    </div>
  );
}