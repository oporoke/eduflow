"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentLibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search]);

  const fetchData = async () => {
    const [borrowingsRes] = await Promise.all([fetch("/api/library/borrow")]);
    const borrowingsData = await borrowingsRes.json();
    setBorrowings(borrowingsData);
    fetchBooks();
  };

  const fetchBooks = async () => {
    const url = search ? `/api/library?search=${search}` : "/api/library";
    const res = await fetch(url);
    const data = await res.json();
    setBooks(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Library</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {["catalog", "my borrowings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm capitalize border ${
                activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab === "catalog" ? "📚 Catalog" : `📖 My Borrowings (${borrowings.length})`}
            </button>
          ))}
        </div>

        {activeTab === "catalog" && (
          <div>
            <input
              type="text"
              placeholder="Search books..."
              className="w-full border p-2 rounded text-sm mb-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded shadow p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{book.title}</h3>
                      <p className="text-sm text-gray-500">by {book.author}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {book.category}
                    </span>
                  </div>
                  {book.description && (
                    <p className="text-sm text-gray-600 mt-2">{book.description}</p>
                  )}
                  {book.location && (
                    <p className="text-xs text-gray-400 mt-1">📍 {book.location}</p>
                  )}
                  <div className="mt-3">
                    <span className={`text-xs font-medium ${
                      book.availableCopies > 0 ? "text-green-600" : "text-red-500"
                    }`}>
                      {book.availableCopies > 0
                        ? `✓ ${book.availableCopies} copies available`
                        : "✗ Not available"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "my borrowings" && (
          <div className="space-y-3">
            {borrowings.length === 0 ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📖</p>
                <p>No borrowed books yet</p>
              </div>
            ) : (
              borrowings.map((b) => {
                const isOverdue = b.status === "BORROWED" && new Date(b.dueDate) < new Date();
                return (
                  <div key={b.id} className={`bg-white rounded shadow p-5 border-l-4 ${
                    b.status === "RETURNED" ? "border-green-400" :
                    isOverdue ? "border-red-500" : "border-blue-400"
                  }`}>
                    <h3 className="font-semibold">{b.book?.title}</h3>
                    <p className="text-sm text-gray-500">by {b.book?.author}</p>
                    <div className="flex gap-3 text-xs text-gray-400 mt-2">
                      <span>Borrowed: {new Date(b.borrowedAt).toLocaleDateString()}</span>
                      <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                        Due: {new Date(b.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {isOverdue && (
                      <p className="text-xs text-red-500 font-medium mt-1">⚠️ Please return this book</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}