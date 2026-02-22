"use client";

import { useEffect, useState } from "react";

const SEVERITY_COLORS: { [key: string]: string } = {
  LOW: "bg-yellow-500",
  MEDIUM: "bg-orange-500",
  HIGH: "bg-red-600",
  CRITICAL: "bg-red-800",
};

const SEVERITY_ICONS: { [key: string]: string } = {
  LOW: "⚠️",
  MEDIUM: "🔶",
  HIGH: "🚨",
  CRITICAL: "🆘",
};

export default function EmergencyAlertBanner() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.filter((a: any) => !a.isAcknowledged));
      }
    } catch {}
  };

  const acknowledge = async (alertId: string) => {
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, acknowledge: true }),
    });
    setDismissed((prev) => [...prev, alertId]);
    fetchAlerts();
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 space-y-0">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${SEVERITY_COLORS[alert.severity]} text-white px-4 py-3`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{SEVERITY_ICONS[alert.severity]}</span>
              <div>
                <p className="font-bold text-sm">{alert.title}</p>
                <p className="text-xs opacity-90">{alert.message}</p>
              </div>
            </div>
            <button
              onClick={() => acknowledge(alert.id)}
              className="ml-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs px-3 py-1.5 rounded flex-shrink-0"
            >
              Acknowledge ✓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}