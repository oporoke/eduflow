"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SEVERITY_COLORS: { [key: string]: string } = {
  LOW: "bg-yellow-100 text-yellow-700 border-yellow-300",
  MEDIUM: "bg-orange-100 text-orange-700 border-orange-300",
  HIGH: "bg-red-100 text-red-700 border-red-300",
  CRITICAL: "bg-red-600 text-white border-red-700",
};

const SEVERITY_ICONS: { [key: string]: string } = {
  LOW: "⚠️",
  MEDIUM: "🔶",
  HIGH: "🚨",
  CRITICAL: "🆘",
};

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", severity: "HIGH" });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    setAlerts(data);
  };

  const sendAlert = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("Emergency alert sent to all users!");
      setShowForm(false);
      setForm({ title: "", message: "", severity: "HIGH" });
      fetchAlerts();
    }
    setSending(false);
  };

  const deactivateAlert = async (alertId: string) => {
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, active: false }),
    });
    setMessage("Alert deactivated");
    fetchAlerts();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Emergency Alerts</h1>
            <p className="text-gray-500 text-sm">Send urgent notifications to all users</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              🚨 Send Alert
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Send Alert Form */}
        {showForm && (
          <div className="bg-red-50 border border-red-200 rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4 text-red-700">🚨 Send Emergency Alert</h2>
            <p className="text-sm text-red-600 mb-4">
              This will immediately notify ALL users on the platform.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Alert title (e.g. School Closure Today)"
                className="w-full border p-2 rounded text-sm"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Detailed message..."
                className="w-full border p-2 rounded text-sm h-24 resize-none"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Severity</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={form.severity}
                  onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="LOW">⚠️ Low</option>
                  <option value="MEDIUM">🔶 Medium</option>
                  <option value="HIGH">🚨 High</option>
                  <option value="CRITICAL">🆘 Critical</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={sendAlert}
                  disabled={sending}
                  className="bg-red-600 text-white px-6 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send to All Users"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {alerts.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">✅</p>
            <p>No active emergency alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded shadow p-6 border ${SEVERITY_COLORS[alert.severity]}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{SEVERITY_ICONS[alert.severity]}</span>
                    <div>
                      <h3 className="font-bold">{alert.title}</h3>
                      <p className="text-xs opacity-75">
                        By {alert.author?.name} · {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-75">
                      {alert.acknowledgements?.length} acknowledged
                    </span>
                    <button
                      onClick={() => deactivateAlert(alert.id)}
                      className="text-xs underline opacity-75 hover:opacity-100"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-line">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}