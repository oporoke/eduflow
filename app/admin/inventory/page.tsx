"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: { [key: string]: string } = {
  AVAILABLE: "bg-green-100 text-green-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  DAMAGED: "bg-red-100 text-red-700",
  DISPOSED: "bg-gray-100 text-gray-700",
};

const CONDITION_COLORS: { [key: string]: string } = {
  EXCELLENT: "text-green-600",
  GOOD: "text-blue-600",
  FAIR: "text-yellow-600",
  POOR: "text-red-600",
};

export default function InventoryPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("assets");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [assetForm, setAssetForm] = useState({
    name: "", description: "", serialNumber: "", categoryId: "",
    status: "AVAILABLE", condition: "GOOD", location: "",
    purchaseDate: "", purchaseCost: "", assignedToId: "",
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    description: "", cost: "", date: new Date().toISOString().split("T")[0],
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [filterCategory, filterStatus]);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (filterCategory) params.append("categoryId", filterCategory);
    if (filterStatus) params.append("status", filterStatus);
    const [inventoryRes, usersRes] = await Promise.all([
      fetch(`/api/inventory?${params}`),
      fetch("/api/users"),
    ]);
    const inventoryData = await inventoryRes.json();
    const usersData = await usersRes.json();
    setAssets(inventoryData.assets || []);
    setCategories(inventoryData.categories || []);
    setUsers(usersData);
  };

  const addCategory = async () => {
    if (!categoryName) return;
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", categoryName }),
    });
    setMessage("Category added!");
    setCategoryName("");
    setShowCategoryForm(false);
    fetchData();
  };

  const addAsset = async () => {
    if (!assetForm.name || !assetForm.categoryId) return setError("Name and category required");
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assetForm),
    });
    if (res.ok) {
      setMessage("Asset added!");
      setShowAssetForm(false);
      setAssetForm({ name: "", description: "", serialNumber: "", categoryId: "", status: "AVAILABLE", condition: "GOOD", location: "", purchaseDate: "", purchaseCost: "", assignedToId: "" });
      fetchData();
    }
  };

  const updateAsset = async (updates: any) => {
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedAsset.id, ...updates }),
    });
    setMessage("Asset updated!");
    fetchData();
    setSelectedAsset(null);
  };

  const addMaintenance = async () => {
    if (!maintenanceForm.description) return;
    await updateAsset({
      maintenanceDescription: maintenanceForm.description,
      maintenanceCost: maintenanceForm.cost,
      maintenanceDate: maintenanceForm.date,
      status: "MAINTENANCE",
    });
    setMaintenanceForm({ description: "", cost: "", date: new Date().toISOString().split("T")[0] });
  };

  const totalValue = assets.reduce((acc, a) => acc + (a.purchaseCost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Inventory & Assets</h1>
            <p className="text-gray-500 text-sm">Track school equipment and resources</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{assets.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Assets</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {assets.filter((a) => a.status === "AVAILABLE").length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Available</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {assets.filter((a) => a.status === "MAINTENANCE").length}
            </p>
            <p className="text-xs text-gray-500 mt-1">In Maintenance</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              KES {totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Value</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["assets", "categories"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm capitalize border ${
                activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab === "assets" ? "📦 Assets" : "🏷️ Categories"}
            </button>
          ))}
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Asset Categories</h2>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
              >
                + Add Category
              </button>
            </div>
            {showCategoryForm && (
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Category name (e.g. Computers, Furniture)"
                  className="flex-1 border p-2 rounded text-sm"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                <button onClick={addCategory} className="bg-blue-600 text-white px-4 rounded text-sm">
                  Add
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded shadow p-5">
                  <h3 className="font-semibold">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.assets?.length} assets</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === "assets" && (
          <div>
            <div className="flex gap-3 mb-4 flex-wrap">
              <select
                className="border p-2 rounded text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="border p-2 rounded text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {["AVAILABLE", "ASSIGNED", "MAINTENANCE", "DAMAGED", "DISPOSED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAssetForm(!showAssetForm)}
                className="ml-auto bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                + Add Asset
              </button>
            </div>

            {showAssetForm && (
              <div className="bg-white rounded shadow p-6 mb-4">
                <h2 className="font-semibold mb-4">Add Asset</h2>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Asset name" className="border p-2 rounded text-sm"
                    value={assetForm.name} onChange={(e) => setAssetForm((p) => ({ ...p, name: e.target.value }))} />
                  <select className="border p-2 rounded text-sm"
                    value={assetForm.categoryId} onChange={(e) => setAssetForm((p) => ({ ...p, categoryId: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="text" placeholder="Serial number (optional)" className="border p-2 rounded text-sm"
                    value={assetForm.serialNumber} onChange={(e) => setAssetForm((p) => ({ ...p, serialNumber: e.target.value }))} />
                  <select className="border p-2 rounded text-sm"
                    value={assetForm.condition} onChange={(e) => setAssetForm((p) => ({ ...p, condition: e.target.value }))}>
                    {["EXCELLENT", "GOOD", "FAIR", "POOR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="text" placeholder="Location (e.g. Lab 1)" className="border p-2 rounded text-sm"
                    value={assetForm.location} onChange={(e) => setAssetForm((p) => ({ ...p, location: e.target.value }))} />
                  <input type="date" className="border p-2 rounded text-sm"
                    value={assetForm.purchaseDate} onChange={(e) => setAssetForm((p) => ({ ...p, purchaseDate: e.target.value }))} />
                  <input type="number" placeholder="Purchase cost (KES)" className="border p-2 rounded text-sm"
                    value={assetForm.purchaseCost} onChange={(e) => setAssetForm((p) => ({ ...p, purchaseCost: e.target.value }))} />
                  <select className="border p-2 rounded text-sm"
                    value={assetForm.assignedToId} onChange={(e) => setAssetForm((p) => ({ ...p, assignedToId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <textarea placeholder="Description (optional)" className="border p-2 rounded text-sm col-span-3 h-16 resize-none"
                    value={assetForm.description} onChange={(e) => setAssetForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <button onClick={addAsset} className="mt-3 bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
                  Add Asset
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.length === 0 ? (
                <div className="col-span-2 bg-white rounded shadow p-8 text-center text-gray-400">
                  <p className="text-4xl mb-3">📦</p>
                  <p>No assets yet. Add categories first then add assets.</p>
                </div>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} className="bg-white rounded shadow p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{asset.name}</h3>
                        <p className="text-xs text-gray-400">{asset.category?.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[asset.status]}`}>
                        {asset.status}
                      </span>
                    </div>
                    {asset.serialNumber && (
                      <p className="text-xs text-gray-400">S/N: {asset.serialNumber}</p>
                    )}
                    {asset.location && (
                      <p className="text-xs text-gray-400">📍 {asset.location}</p>
                    )}
                    {asset.assignedTo && (
                      <p className="text-xs text-gray-500">👤 {asset.assignedTo.name}</p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2 text-xs">
                        <span className={CONDITION_COLORS[asset.condition]}>
                          {asset.condition}
                        </span>
                        {asset.purchaseCost && (
                          <span className="text-gray-400">
                            KES {asset.purchaseCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Manage
                      </button>
                    </div>

                    {asset.maintenanceLogs?.length > 0 && (
                      <div className="mt-3 border-t pt-2">
                        <p className="text-xs text-gray-500 mb-1">Latest maintenance:</p>
                        <p className="text-xs text-gray-600">
                          {asset.maintenanceLogs[0].description} —{" "}
                          {new Date(asset.maintenanceLogs[0].date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Manage Asset Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">{selectedAsset.name}</h2>
                <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <select
                    className="w-full border p-2 rounded text-sm"
                    defaultValue={selectedAsset.status}
                    onChange={(e) => updateAsset({ status: e.target.value })}
                  >
                    {["AVAILABLE", "ASSIGNED", "MAINTENANCE", "DAMAGED", "DISPOSED"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Assign To</label>
                  <select
                    className="w-full border p-2 rounded text-sm"
                    defaultValue={selectedAsset.assignedToId || ""}
                    onChange={(e) => updateAsset({ assignedToId: e.target.value || null, status: e.target.value ? "ASSIGNED" : "AVAILABLE" })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-sm mb-3">Log Maintenance</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Description"
                      className="w-full border p-2 rounded text-sm"
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm((p) => ({ ...p, description: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Cost (KES)"
                        className="border p-2 rounded text-sm"
                        value={maintenanceForm.cost}
                        onChange={(e) => setMaintenanceForm((p) => ({ ...p, cost: e.target.value }))}
                      />
                      <input
                        type="date"
                        className="border p-2 rounded text-sm"
                        value={maintenanceForm.date}
                        onChange={(e) => setMaintenanceForm((p) => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <button
                      onClick={addMaintenance}
                      className="w-full bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700"
                    >
                      Log Maintenance
                    </button>
                  </div>
                </div>

                {selectedAsset.maintenanceLogs?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-sm mb-2">Maintenance History</h3>
                    {selectedAsset.maintenanceLogs.map((log: any) => (
                      <div key={log.id} className="text-xs text-gray-600 mb-2 bg-gray-50 p-2 rounded">
                        <p>{log.description}</p>
                        <p className="text-gray-400 mt-1">
                          {new Date(log.date).toLocaleDateString()}
                          {log.cost && ` · KES ${log.cost.toLocaleString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}