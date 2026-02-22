"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Fiction", "Non-Fiction", "Science", "Mathematics", "History", "Geography", "Language", "Religion", "Arts", "Reference", "Other"];

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("catalog");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", category: "Fiction", description: "", totalCopies: 1, location: "" });
  const [borrowForm, setBorrowForm] = useState({ borrowerId: "", dueDate: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search]);

  const fetchData = async () => {
    const [borrowingsRes, usersRes] = await Promise.all([
      fetch("/api/library/borrow"),
      fetch("/api/users"),
    ]);
    const borrowingsData = await borrowingsRes.json();
    const usersData = await usersRes.json();
    setBorrowings(borrowingsData);
    setUsers(usersData);
    fetchBooks();
  };

  const fetchBooks = async () => {
    const url = search ? `/api/library?search=${search}` : "/api/library";
    const res = await fetch(url);
    const data = await res.json();
    setBooks(data);
  };

  const addBook = async () => {
    if (!form.title || !form.author) return setError("Title and author required");
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("Book added!");
      setShowForm(false);
      setForm({ title: "", author: "", isbn: "", category: "Fiction", description: "", totalCopies: 1, location: "" });
      fetchBooks();
    }
  };

  const issueBook = async () => {
    if (!borrowForm.borrowerId || !borrowForm.dueDate) return setError("Borrower and due date required");
    const res = await fetch("/api/library/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: selectedBook.id, ...borrowForm }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Book issued successfully!");
      setShowBorrowForm(false);
      setSelectedBook(null);
      setBorrowForm({ borrowerId: "", dueDate: "" });
      fetchData();
    }
  };

  const returnBook = async (borrowingId: string) => {
    await fetch("/api/library/borrow", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowingId }),
    });
    setMessage("Book returned!");
    fetchData();
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/library?id=${id}`, { method: "DELETE" });
    fetchBooks();
  };

  const activeBorrowings = borrowings.filter((b) => b.status === "BORROWED");
  const overdueBorrowings = activeBorrowings.filter((b) => new Date(b.dueDate) < new Date());

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Library Management</h1>
            <p className="text-gray-500 text-sm">Manage books, borrowings and returns</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{books.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Books</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {books.reduce((acc, b) => acc + b.availableCopies, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Available</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{activeBorrowings.length}</p>
            <p className="text-xs text-gray-500 mt-1">Borrowed</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{overdueBorrowings.length}</p>
            <p className="text-xs text-gray-500 mt-1">Overdue</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["catalog", "borrowings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm capitalize border ${
                activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab === "catalog" ? "📚 Catalog" : `📋 Borrowings (${activeBorrowings.length})`}
            </button>
          ))}
        </div>

        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Search books by title, author or ISBN..."
                className="flex-1 border p-2 rounded text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                + Add Book
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded shadow p-6 mb-4">
                <h2 className="font-semibold mb-4">Add Book</h2>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Title" className="border p-2 rounded text-sm"
                    value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                  <input type="text" placeholder="Author" className="border p-2 rounded text-sm"
                    value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} />
                  <input type="text" placeholder="ISBN (optional)" className="border p-2 rounded text-sm"
                    value={form.isbn} onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))} />
                  <select className="border p-2 rounded text-sm"
                    value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Total Copies" className="border p-2 rounded text-sm"
                    value={form.totalCopies} onChange={(e) => setForm((p) => ({ ...p, totalCopies: parseInt(e.target.value) }))} />
                  <input type="text" placeholder="Location (e.g. Shelf A1)" className="border p-2 rounded text-sm"
                    value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                  <textarea placeholder="Description (optional)" className="border p-2 rounded text-sm col-span-2 h-16 resize-none"
                    value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <button onClick={addBook} className="mt-3 bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
                  Add Book
                </button>
              </div>
            )}

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
                  {book.isbn && <p className="text-xs text-gray-400">ISBN: {book.isbn}</p>}
                  {book.location && <p className="text-xs text-gray-400">Location: {book.location}</p>}
                  {book.description && <p className="text-sm text-gray-600 mt-2">{book.description}</p>}
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-600 font-medium">
                        {book.availableCopies} available
                      </span>
                      <span className="text-gray-400">
                        of {book.totalCopies} copies
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {book.availableCopies > 0 && (
                        <button
                          onClick={() => { setSelectedBook(book); setShowBorrowForm(true); setError(""); }}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Issue
                        </button>
                      )}
                      <button
                        onClick={() => deleteBook(book.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Borrowings Tab */}
        {activeTab === "borrowings" && (
          <div className="space-y-3">
            {borrowings.length === 0 ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📖</p>
                <p>No borrowing records yet</p>
              </div>
            ) : (
              borrowings.map((b) => {
                const isOverdue = b.status === "BORROWED" && new Date(b.dueDate) < new Date();
                return (
                  <div key={b.id} className={`bg-white rounded shadow p-5 border-l-4 ${
                    b.status === "RETURNED" ? "border-green-400" :
                    isOverdue ? "border-red-500" : "border-blue-400"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{b.book?.title}</h3>
                        <p className="text-sm text-gray-500">by {b.book?.author}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Borrower: {b.borrower?.name}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-400 mt-1">
                          <span>Borrowed: {new Date(b.borrowedAt).toLocaleDateString()}</span>
                          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                            Due: {new Date(b.dueDate).toLocaleDateString()}
                          </span>
                          {b.returnedAt && (
                            <span>Returned: {new Date(b.returnedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        {isOverdue && (
                          <p className="text-xs text-red-500 font-medium mt-1">⚠️ Overdue</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          b.status === "RETURNED" ? "bg-green-100 text-green-600" :
                          isOverdue ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          {b.status}
                        </span>
                        {b.status === "BORROWED" && (
                          <button
                            onClick={() => returnBook(b.id)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Issue Book Modal */}
        {showBorrowForm && selectedBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="font-semibold mb-1">Issue Book</h2>
              <p className="text-sm text-gray-500 mb-4">{selectedBook.title}</p>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Borrower</label>
                  <select
                    className="w-full border p-2 rounded text-sm"
                    value={borrowForm.borrowerId}
                    onChange={(e) => setBorrowForm((p) => ({ ...p, borrowerId: e.target.value }))}
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded text-sm"
                    value={borrowForm.dueDate}
                    onChange={(e) => setBorrowForm((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={issueBook}
                  className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700"
                >
                  Issue Book
                </button>
                <button
                  onClick={() => { setShowBorrowForm(false); setSelectedBook(null); }}
                  className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}