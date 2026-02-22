"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const AUDIENCES = ["ALL", "STUDENT", "TEACHER", "ADMIN"];

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "ALL", pinned: false });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(data);
  };

  const createAnnouncement = async () => {
    if (!form.title || !form.body) return;
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("Announcement posted!");
      setShowForm(false);
      setForm({ title: "", body: "", audience: "ALL", pinned: false });
      fetchAnnouncements();
    }
  };

  const markRead = async (announcementId: string) => {
    await fetch("/api/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId }),
    });
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const audienceColors: { [key: string]: string } = {
    ALL: "bg-blue-100 text-blue-700",
    STUDENT: "bg-green-100 text-green-700",
    TEACHER: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-600 mt-1">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex gap-3">
            {(role === "ADMIN" || role === "TEACHER") && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                + New Announcement
              </button>
            )}
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Post Announcement</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Announcement title"
                className="w-full border p-2 rounded text-sm"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Announcement body..."
                className="w-full border p-2 rounded text-sm h-28 resize-none"
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Audience</label>
                  <select
                    className="w-full border p-2 rounded text-sm"
                    value={form.audience}
                    onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={form.pinned}
                    onChange={(e) => setForm((prev) => ({ ...prev, pinned: e.target.checked }))}
                    className="accent-blue-600"
                  />
                  <label htmlFor="pinned" className="text-sm text-gray-600">Pin announcement</label>
                </div>
              </div>
              <button
                onClick={createAnnouncement}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Post
              </button>
            </div>
          </div>
        )}

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📢</p>
            <p>No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`bg-white rounded shadow p-6 border-l-4 ${
                  a.pinned ? "border-yellow-500" :
                  a.isRead ? "border-gray-200" : "border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <span className="text-yellow-500 text-sm">📌</span>}
                    <h3 className="font-semibold">{a.title}</h3>
                    {!a.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${audienceColors[a.audience]}`}>
                      {a.audience}
                    </span>
                    {role === "ADMIN" && (
                      <button
                        onClick={() => deleteAnnouncement(a.id)}
                        className="text-red-400 text-xs hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-line mb-3">{a.body}</p>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    By {a.author?.name} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                  {!a.isRead && (
                    <button
                      onClick={() => markRead(a.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}