"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";

const ITEM_TYPES = ["Project", "Essay", "Quiz Result", "Certificate", "Artwork", "Other"];

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Project");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setPortfolio(data);
    setBio(data?.bio || "");
  };

  const saveBio = async () => {
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    setEditingBio(false);
    fetchPortfolio();
  };

  const addItem = async () => {
    if (!title) return setError("Title is required");
    const res = await fetch("/api/portfolio/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type, content, fileUrl }),
    });

    if (res.ok) {
      setMessage("Item added to portfolio!");
      setTitle("");
      setDescription("");
      setContent("");
      setFileUrl("");
      setType("Project");
      setShowForm(false);
      fetchPortfolio();
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Remove this item from your portfolio?")) return;
    await fetch(`/api/portfolio/items?id=${itemId}`, { method: "DELETE" });
    fetchPortfolio();
  };

  const typeColors: { [key: string]: string } = {
    Project: "bg-blue-100 text-blue-700",
    Essay: "bg-purple-100 text-purple-700",
    "Quiz Result": "bg-green-100 text-green-700",
    Certificate: "bg-yellow-100 text-yellow-700",
    Artwork: "bg-pink-100 text-pink-700",
    Other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Portfolio</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Bio Section */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">About Me</h2>
            <button
              onClick={() => setEditingBio(!editingBio)}
              className="text-sm text-blue-600 hover:underline"
            >
              {editingBio ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingBio ? (
            <div>
              <textarea
                className="w-full border rounded p-2 text-sm h-24 resize-none"
                placeholder="Write a short bio about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <button
                onClick={saveBio}
                className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              {portfolio?.bio || "No bio yet. Click Edit to add one."}
            </p>
          )}
        </div>

        {/* Add Item */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Portfolio Items ({portfolio?.items?.length || 0})</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Item"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h3 className="font-semibold mb-4">Add Portfolio Item</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                className="w-full border p-2 rounded text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select
                className="w-full border p-2 rounded text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <textarea
                placeholder="Description (optional)"
                className="w-full border p-2 rounded text-sm h-20 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <textarea
                placeholder="Content or notes (optional)"
                className="w-full border p-2 rounded text-sm h-20 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div>
                <p className="text-sm text-gray-600 mb-2">Upload a file (optional)</p>
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) setFileUrl(res[0].url);
                  }}
                  onUploadError={(err) => setError(err.message)}
                />
                {fileUrl && (
                  <p className="text-xs text-green-600 mt-1">✓ File uploaded</p>
                )}
              </div>
              <button
                onClick={addItem}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Items */}
        {!portfolio?.items?.length ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📁</p>
            <p>No items yet. Add your best work to your portfolio!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.items.map((item: any) => (
              <div key={item.id} className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${typeColors[item.type] || "bg-gray-100 text-gray-600"}`}>
                    {item.type}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                )}
                {item.content && (
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{item.content}</p>
                )}
                {item.fileUrl && ( <a href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    📎 View File
                  </a>
                )}
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-400 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}