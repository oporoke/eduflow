"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-600",
  COMPLETED: "bg-green-100 text-green-600",
  FAILED: "bg-red-100 text-red-600",
};

export default function StudentFeesPage() {
  const router = useRouter();
  const [fees, setFees] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkoutId, setCheckoutId] = useState("");
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && checkoutId) {
      interval = setInterval(async () => {
        const res = await fetch(`/api/mpesa/status?checkoutId=${checkoutId}`);
        const data = await res.json();
        if (data.status === "COMPLETED") {
          setMessage("✅ Payment successful! M-Pesa code: " + (data.mpesaResult?.MpesaReceiptNumber || ""));
          setPolling(false);
          setCheckoutId("");
          fetchFees();
        } else if (data.status === "FAILED") {
          setError("❌ Payment failed or cancelled. Please try again.");
          setPolling(false);
          setCheckoutId("");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, checkoutId]);

  const fetchFees = async () => {
    const res = await fetch("/api/fees");
    const data = await res.json();
    setFees(data);
  };

  const initiatePayment = async (feeId: string) => {
    if (!phone) return setError("Please enter your M-Pesa phone number");
    if (!amount) return setError("Please enter amount to pay");
    setError("");
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/mpesa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feeStructureId: feeId, phone, amount }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage("📱 " + data.message);
      setCheckoutId(data.checkoutId);
      setPolling(true);
      setSelectedFee(null);
    } else {
      setError(data.error || "Payment failed");
    }
  };

  const totalOwed = fees.reduce((acc, f) => {
    const paid = f.feePayments?.filter((p: any) => p.status === "COMPLETED")
      .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    return acc + Math.max(f.totalAmount - paid, 0);
  }, 0);

  const totalPaid = fees.reduce((acc, f) =>
    acc + (f.feePayments?.filter((p: any) => p.status === "COMPLETED")
      .reduce((sum: number, p: any) => sum + p.amount, 0) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">School Fees</h1>
            <p className="text-gray-500 text-sm">Pay school fees securely via M-Pesa</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">KES {totalPaid.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total Paid</p>
          </div>
          <div className={`rounded shadow p-4 text-center ${totalOwed > 0 ? "bg-red-50" : "bg-gray-50"}`}>
            <p className={`text-2xl font-bold ${totalOwed > 0 ? "text-red-600" : "text-gray-400"}`}>
              KES {totalOwed.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Outstanding Balance</p>
          </div>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <p className="text-green-700 text-sm">{message}</p>
            {polling && (
              <p className="text-green-600 text-xs mt-1 animate-pulse">
                Waiting for payment confirmation...
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {fees.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">💰</p>
            <p>No fee structures assigned to your class yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fees.map((fee) => {
              const paid = fee.feePayments?.filter((p: any) => p.status === "COMPLETED")
                .reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
              const balance = fee.totalAmount - paid;
              const pct = Math.min(Math.round((paid / fee.totalAmount) * 100), 100);
              const myPayments = fee.feePayments || [];

              return (
                <div key={fee.id} className="bg-white rounded shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{fee.term} {fee.academicYear}</h3>
                      <p className="text-sm text-gray-500">{fee.classroom?.name}</p>
                      {fee.description && <p className="text-sm text-gray-400">{fee.description}</p>}
                      {fee.dueDate && (
                        <p className="text-xs text-orange-500 mt-1">
                          Due: {new Date(fee.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        KES {fee.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">total fee</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>KES {paid.toLocaleString()} paid</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {balance > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Balance: KES {balance.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Fee Items */}
                  {fee.feeItems?.length > 0 && (
                    <div className="mb-4 bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Fee Breakdown</p>
                      {fee.feeItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{item.name}</span>
                          <span>KES {item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pay Button */}
                  {balance > 0 && (
                    <>
                      {selectedFee?.id === fee.id ? (
                        <div className="border-t pt-4 space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              M-Pesa Phone Number
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. 0712345678"
                              className="w-full border p-2 rounded text-sm"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Amount (KES) — Balance: {balance.toLocaleString()}
                            </label>
                            <input
                              type="number"
                              placeholder={`Max: ${balance}`}
                              className="w-full border p-2 rounded text-sm"
                              value={amount}
                              max={balance}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => initiatePayment(fee.id)}
                              disabled={loading}
                              className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {loading ? "Sending..." : "💚 Pay via M-Pesa"}
                            </button>
                            <button
                              onClick={() => setSelectedFee(null)}
                              className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-xs text-gray-400">
                            You will receive an M-Pesa prompt on your phone to confirm payment
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedFee(fee); setAmount(balance.toString()); }}
                          className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2"
                        >
                          💚 Pay via M-Pesa
                        </button>
                      )}
                    </>
                  )}

                  {balance <= 0 && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <span>✅</span>
                      <span>Fully Paid</span>
                    </div>
                  )}

                  {/* Payment History */}
                  {myPayments.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Payment History</p>
                      {myPayments.map((payment: any) => (
                        <div key={payment.id} className="flex justify-between items-center text-xs mb-1">
                          <div>
                            <span className="text-gray-600">KES {payment.amount.toLocaleString()}</span>
                            {payment.mpesaCode && (
                              <span className="text-green-600 ml-2 font-medium">{payment.mpesaCode}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[payment.status]}`}>
                              {payment.status}
                            </span>
                            <span className="text-gray-400">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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