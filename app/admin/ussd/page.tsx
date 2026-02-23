"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function USSDPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  const updatePhone = async () => {
    if (!selectedUser || !phone) return;
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, phone }),
    });
    if (res.ok) {
      setMessage(`Phone number updated for ${selectedUser.name}`);
      setSelectedUser(null);
      setPhone("");
      fetchUsers();
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone || !testMessage) return;
    setSending(true);
    const res = await fetch("/api/ussd/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, message: testMessage }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setMessage("Test SMS sent successfully!");
      setTestMessage("");
    } else {
      setMessage(data.error || "Failed to send SMS");
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const withPhone = users.filter((u) => u.phone).length;
  const withoutPhone = users.filter((u) => !u.phone).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">USSD & SMS Configuration</h1>
            <p className="text-gray-500 text-sm">
              Manage phone numbers and test USSD/SMS fallback
            </p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{withPhone}</p>
            <p className="text-xs text-gray-500 mt-1">📱 With Phone Number</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{withoutPhone}</p>
            <p className="text-xs text-gray-500 mt-1">⚠️ No Phone Number</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* User Phone Management */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="font-semibold mb-4">📱 User Phone Numbers</h2>
            <p className="text-xs text-gray-500 mb-3">
              Students need a phone number to use USSD. Add numbers here.
            </p>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full border p-2 rounded text-sm mb-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                    selectedUser?.id === user.id ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    setPhone(user.phone || "");
                  }}
                >
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.role} · {user.email}</p>
                  </div>
                  {user.phone ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {user.phone}
                    </span>
                  ) : (
                    <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">
                      No phone
                    </span>
                  )}
                </div>
              ))}
            </div>

            {selectedUser && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-medium mb-2">
                  Update phone for {selectedUser.name}
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    className="flex-1 border p-2 rounded text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <button
                    onClick={updatePhone}
                    className="bg-blue-600 text-white px-4 rounded text-sm hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* USSD Info & SMS Test */}
          <div className="space-y-4">
            {/* USSD Info */}
            <div className="bg-white rounded shadow p-6">
              <h2 className="font-semibold mb-4">📟 USSD Setup Guide</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-blue-50 rounded p-3">
                  <p className="font-medium text-blue-700 mb-1">USSD Endpoint</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border block">
                    POST /api/ussd
                  </code>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium mb-2">Student USSD Menu:</p>
                  <p className="text-xs font-mono">1. Today's Lesson</p>
                  <p className="text-xs font-mono">2. Take Quiz</p>
                  <p className="text-xs font-mono">3. My Progress</p>
                  <p className="text-xs font-mono">4. Contact Teacher</p>
                  <p className="text-xs font-mono">5. Announcements</p>
                </div>
                <div className="bg-yellow-50 rounded p-3">
                  <p className="font-medium text-yellow-700 mb-1">⚠️ Setup Required</p>
                  <p className="text-xs">
                    Register your USSD shortcode on Africa's Talking dashboard and point the callback URL to your deployed app.
                  </p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="font-medium text-green-700 mb-1">Callback URL</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border block break-all">
                    https://your-app.vercel.app/api/ussd
                  </code>
                </div>
              </div>
            </div>

            {/* Test SMS */}
            <div className="bg-white rounded shadow p-6">
              <h2 className="font-semibold mb-4">📤 Test SMS</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    className="w-full border p-2 rounded text-sm"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Message</label>
                  <textarea
                    placeholder="Test SMS message..."
                    className="w-full border p-2 rounded text-sm h-20 resize-none"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-400 text-right">{testMessage.length}/160</p>
                </div>
                <button
                  onClick={sendTestSMS}
                  disabled={sending || !testPhone || !testMessage}
                  className="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "📤 Send Test SMS"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}