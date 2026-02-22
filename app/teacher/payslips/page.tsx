"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherPayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    const res = await fetch("/api/payroll");
    const data = await res.json();
    setPayslips(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Payslips</h1>
            <p className="text-gray-500 text-sm">View your monthly salary statements</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {payslips.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">💵</p>
            <p>No payslips yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payslips.map((payslip) => (
              <div
                key={payslip.id}
                className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-md transition"
                onClick={() => setSelected(selected?.id === payslip.id ? null : payslip)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      {payslip.period?.month} {payslip.period?.year}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Net Salary: KES {payslip.netSalary.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      payslip.status === "PAID" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                    }`}>
                      {payslip.status}
                    </span>
                    <span className="text-gray-400">{selected?.id === payslip.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {selected?.id === payslip.id && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium text-sm mb-3">Payslip Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500">Basic Salary</p>
                        <p className="font-semibold">KES {payslip.basicSalary.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500">Allowances</p>
                        <p className="font-semibold">KES {payslip.allowances.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500">Gross Salary</p>
                        <p className="font-semibold">
                          KES {(payslip.basicSalary + payslip.allowances).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs text-gray-500">PAYE Tax</p>
                        <p className="font-semibold text-red-600">KES {payslip.paye.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs text-gray-500">NHIF</p>
                        <p className="font-semibold text-red-600">KES {payslip.nhif.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs text-gray-500">NSSF</p>
                        <p className="font-semibold text-red-600">KES {payslip.nssf.toLocaleString()}</p>
                      </div>
                      {payslip.deductions > 0 && (
                        <div className="bg-red-50 rounded p-3">
                          <p className="text-xs text-gray-500">Other Deductions</p>
                          <p className="font-semibold text-red-600">KES {payslip.deductions.toLocaleString()}</p>
                        </div>
                      )}
                      <div className="bg-green-50 rounded p-3 col-span-2">
                        <p className="text-xs text-gray-500">Net Salary</p>
                        <p className="text-xl font-bold text-green-600">
                          KES {payslip.netSalary.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}