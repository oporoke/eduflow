"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SCHOOL_TYPES = ["PRIMARY", "SECONDARY", "MIXED"];
const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
  "Kiambu", "Machakos", "Meru", "Nyeri", "Kisii", "Kakamega",
  "Kilifi", "Kwale", "Taita Taveta", "Makueni", "Kajiado",
  "Muranga", "Kirinyaga", "Nyandarua", "Laikipia", "Samburu",
  "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi",
  "Baringo", "Kericho", "Bomet", "Narok", "Migori", "Homa Bay",
  "Siaya", "Vihiga", "Bungoma", "Busia", "West Pokot", "Turkana",
  "Marsabit", "Isiolo", "Garissa", "Wajir", "Mandera", "Tana River",
  "Lamu", "Embu", "Tharaka Nithi", "Nyamira", "Kitui", "Murang'a",
];

export default function CountyDashboard() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [counties, setCounties] = useState<string[]>([]);
  const [filterCounty, setFilterCounty] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", code: "", county: "Nairobi", subCounty: "",
    address: "", phone: "", email: "", type: "PRIMARY",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "", body: "", county: "Nairobi",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filterCounty]);

  const fetchData = async () => {
    setLoading(true);
    const url = filterCounty
      ? `/api/schools?county=${encodeURIComponent(filterCounty)}`
      : "/api/schools";
    const [schoolsRes, announcementsRes] = await Promise.all([
      fetch(url),
      fetch("/api/schools/county"),
    ]);
    const schoolsData = await schoolsRes.json();
    const countiesData = await announcementsRes.json();
    setSchools(schoolsData);
    setCounties(countiesData);
    setLoading(false);
  };

  const createSchool = async () => {
    if (!form.name || !form.code || !form.county) return;
    const res = await fetch("/api/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("School registered!");
      setShowForm(false);
      setForm({ name: "", code: "", county: "Nairobi", subCounty: "", address: "", phone: "", email: "", type: "PRIMARY" });
      fetchData();
    } else {
      const data = await res.json();
      setMessage(data.error);
    }
  };

  const sendCountyAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.body) return;
    await fetch("/api/schools/county", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcementForm),
    });
    setMessage("County announcement sent!");
    setAnnouncementForm({ title: "", body: "", county: "Nairobi" });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // County-level aggregates
  const totalStudents = schools.reduce((acc, s) => acc + s.stats.studentCount, 0);
  const totalTeachers = schools.reduce((acc, s) => acc + s.stats.teacherCount, 0);
  const countyAvg = schools.length
    ? Math.round(schools.reduce((acc, s) => acc + s.stats.avgScore, 0) / schools.length)
    : 0;
  const topSchool = [...schools].sort((a, b) => b.stats.avgScore - a.stats.avgScore)[0];
  const needsSupport = schools.filter((s) => s.stats.avgScore < 50);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">County Network</h1>
            <p className="text-gray-500 text-sm mt-1">
              Multi-school performance overview across Kenya
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Register School
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Register School Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Register New School</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">School Name</label>
                <input type="text" placeholder="e.g. Nairobi Primary School" className="w-full border p-2 rounded text-sm"
                  value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">School Code</label>
                <input type="text" placeholder="e.g. NPS001" className="w-full border p-2 rounded text-sm"
                  value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select className="w-full border p-2 rounded text-sm"
                  value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">County</label>
                <select className="w-full border p-2 rounded text-sm"
                  value={form.county} onChange={(e) => setForm((p) => ({ ...p, county: e.target.value }))}>
                  {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sub-County</label>
                <input type="text" placeholder="Sub-county" className="w-full border p-2 rounded text-sm"
                  value={form.subCounty} onChange={(e) => setForm((p) => ({ ...p, subCounty: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                <input type="text" placeholder="School phone" className="w-full border p-2 rounded text-sm"
                  value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input type="email" placeholder="School email" className="w-full border p-2 rounded text-sm"
                  value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Address</label>
                <input type="text" placeholder="Physical address" className="w-full border p-2 rounded text-sm"
                  value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
            <button onClick={createSchool} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              Register School
            </button>
          </div>
        )}

        {/* County Filter */}
        <div className="flex gap-3 mb-6">
          <select
            className="border p-2 rounded text-sm"
            value={filterCounty}
            onChange={(e) => setFilterCounty(e.target.value)}
          >
            <option value="">All Counties</option>
            {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-sm text-gray-500 self-center">{schools.length} schools</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{schools.length}</p>
            <p className="text-xs text-gray-500 mt-1">🏫 Schools</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalStudents}</p>
            <p className="text-xs text-gray-500 mt-1">👨‍🎓 Students</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalTeachers}</p>
            <p className="text-xs text-gray-500 mt-1">👨‍🏫 Teachers</p>
          </div>
          <div className={`rounded-xl shadow p-4 text-center ${countyAvg >= 70 ? "bg-green-50" : countyAvg >= 50 ? "bg-yellow-50" : "bg-red-50"}`}>
            <p className={`text-2xl font-bold ${getScoreColor(countyAvg)}`}>{countyAvg}%</p>
            <p className="text-xs text-gray-500 mt-1">📊 County Average</p>
          </div>
          <div className={`rounded-xl shadow p-4 text-center ${needsSupport.length === 0 ? "bg-green-50" : "bg-red-50"}`}>
            <p className={`text-2xl font-bold ${needsSupport.length === 0 ? "text-green-600" : "text-red-600"}`}>
              {needsSupport.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">🚨 Need Support</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["overview", "schools", "announce"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm border ${
                activeTab === tab ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab === "overview" ? "📊 Overview" : tab === "schools" ? "🏫 All Schools" : "📢 Announce"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Performance Ranking */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">🏆 School Performance Ranking</h2>
              {schools.length === 0 ? (
                <p className="text-gray-400 text-sm">No schools registered yet</p>
              ) : (
                <div className="space-y-3">
                  {[...schools]
                    .sort((a, b) => b.stats.avgScore - a.stats.avgScore)
                    .map((school, i) => (
                      <div key={school.id} className="flex items-center gap-3">
                        <span className="text-lg w-8 text-center">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <div>
                              <p className="text-sm font-medium">{school.name}</p>
                              <p className="text-xs text-gray-400">{school.county} · {school.stats.studentCount} students</p>
                            </div>
                            <p className={`text-sm font-bold ${getScoreColor(school.stats.avgScore)}`}>
                              {school.stats.avgScore}%
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getScoreBg(school.stats.avgScore)}`}
                              style={{ width: `${school.stats.avgScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Schools Needing Support */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">🚨 Schools Needing Support</h2>
              {needsSupport.length === 0 ? (
                <div className="text-center text-gray-400 py-6">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm">All schools performing well!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {needsSupport.map((school) => (
                    <div
                      key={school.id}
                      onClick={() => { setSelected(school); setActiveTab("schools"); }}
                      className="border-l-4 border-red-400 pl-3 cursor-pointer hover:bg-red-50 rounded p-2"
                    >
                      <p className="font-medium text-sm">{school.name}</p>
                      <p className="text-xs text-gray-400">{school.county} · {school.subCounty}</p>
                      <div className="flex gap-3 text-xs mt-1">
                        <span className="text-red-600 font-bold">{school.stats.avgScore}% avg</span>
                        <span className="text-gray-500">{school.stats.studentCount} students</span>
                        <span className="text-gray-500">{school.stats.teacherCount} teachers</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* County Breakdown */}
            {counties.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6 col-span-2">
                <h2 className="font-semibold mb-4">🗺️ County Breakdown</h2>
                <div className="grid grid-cols-4 gap-3">
                  {counties.map((county) => {
                    const countySchools = schools.filter((s) => s.county === county);
                    const avg = countySchools.length
                      ? Math.round(countySchools.reduce((acc, s) => acc + s.stats.avgScore, 0) / countySchools.length)
                      : 0;
                    return (
                      <div
                        key={county}
                        onClick={() => setFilterCounty(county)}
                        className="bg-gray-50 rounded p-3 cursor-pointer hover:shadow-md transition text-center"
                      >
                        <p className="font-medium text-sm">{county}</p>
                        <p className={`text-lg font-bold mt-1 ${getScoreColor(avg)}`}>{avg}%</p>
                        <p className="text-xs text-gray-400">{countySchools.length} schools</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Schools Tab */}
        {activeTab === "schools" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-3 max-h-screen overflow-y-auto">
              {loading ? (
                <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                  <p className="animate-pulse">Loading schools...</p>
                </div>
              ) : schools.length === 0 ? (
                <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                  <p className="text-3xl mb-2">🏫</p>
                  <p className="text-sm">No schools registered yet</p>
                </div>
              ) : (
                schools.map((school) => (
                  <div
                    key={school.id}
                    onClick={() => setSelected(school)}
                    className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                      selected?.id === school.id
                        ? "border-blue-500"
                        : school.stats.avgScore >= 70
                        ? "border-green-400"
                        : school.stats.avgScore >= 50
                        ? "border-yellow-400"
                        : "border-red-400"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{school.name}</h3>
                        <p className="text-xs text-gray-400">{school.code} · {school.type}</p>
                        <p className="text-xs text-gray-400">{school.county}{school.subCounty ? ` · ${school.subCounty}` : ""}</p>
                      </div>
                      <p className={`text-xl font-bold ${getScoreColor(school.stats.avgScore)}`}>
                        {school.stats.avgScore}%
                      </p>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>👨‍🎓 {school.stats.studentCount}</span>
                      <span>👨‍🏫 {school.stats.teacherCount}</span>
                      <span>🏫 {school.stats.classCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="col-span-2">
              {!selected ? (
                <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                  <p className="text-4xl mb-3">🏫</p>
                  <p>Select a school to view details</p>
                </div>
              ) : (
                <div className="bg-white rounded shadow p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold">{selected.name}</h2>
                      <p className="text-sm text-gray-500">{selected.code} · {selected.type}</p>
                      <p className="text-sm text-gray-500">{selected.county}{selected.subCounty ? `, ${selected.subCounty}` : ""}</p>
                      {selected.address && <p className="text-sm text-gray-400">{selected.address}</p>}
                      {selected.phone && <p className="text-sm text-gray-400">📞 {selected.phone}</p>}
                      {selected.email && <p className="text-sm text-gray-400">✉️ {selected.email}</p>}
                    </div>
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${getScoreColor(selected.stats.avgScore)}`}>
                        {selected.stats.avgScore}%
                      </p>
                      <p className="text-xs text-gray-500">Average Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selected.stats.studentCount}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div className="bg-purple-50 rounded p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{selected.stats.teacherCount}</p>
                      <p className="text-xs text-gray-500">Teachers</p>
                    </div>
                    <div className="bg-green-50 rounded p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{selected.stats.classCount}</p>
                      <p className="text-xs text-gray-500">Classes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-4 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{selected.stats.totalLessons}</p>
                      <p className="text-xs text-gray-500">Total Lessons</p>
                    </div>
                    <div className={`rounded p-4 text-center ${selected.stats.avgScore < 50 ? "bg-red-50" : "bg-green-50"}`}>
                      <p className={`text-sm font-semibold ${selected.stats.avgScore < 50 ? "text-red-600" : "text-green-600"}`}>
                        {selected.stats.avgScore >= 70 ? "✅ Performing Well" :
                         selected.stats.avgScore >= 50 ? "⚠️ Needs Monitoring" :
                         "🚨 Needs Urgent Support"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* County Announcements Tab */}
        {activeTab === "announce" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-6">
              <h2 className="font-semibold mb-4">📢 Send County Announcement</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Target County</label>
                  <select
                    className="w-full border p-2 rounded text-sm"
                    value={announcementForm.county}
                    onChange={(e) => setAnnouncementForm((p) => ({ ...p, county: e.target.value }))}
                  >
                    <option value="ALL">All Counties</option>
                    {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Title</label>
                  <input
                    type="text"
                    placeholder="Announcement title"
                    className="w-full border p-2 rounded text-sm"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Message</label>
                  <textarea
                    placeholder="County-wide announcement message..."
                    className="w-full border p-2 rounded text-sm h-32 resize-none"
                    value={announcementForm.body}
                    onChange={(e) => setAnnouncementForm((p) => ({ ...p, body: e.target.value }))}
                  />
                </div>
                <button
                  onClick={sendCountyAnnouncement}
                  className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
                >
                  Send to {announcementForm.county === "ALL" ? "All Counties" : announcementForm.county}
                </button>
              </div>
            </div>

            <div className="bg-white rounded shadow p-6">
              <h2 className="font-semibold mb-4">🗺️ Network Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <p className="text-sm text-gray-600">Total Schools</p>
                  <p className="font-bold">{schools.length}</p>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="font-bold">{totalStudents}</p>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="font-bold">{totalTeachers}</p>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <p className="text-sm text-gray-600">Network Average Score</p>
                  <p className={`font-bold ${getScoreColor(countyAvg)}`}>{countyAvg}%</p>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <p className="text-sm text-gray-600">Counties Covered</p>
                  <p className="font-bold">{counties.length}</p>
                </div>
                {topSchool && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">🥇 Top School</p>
                    <p className="font-bold text-green-600">{topSchool.name}</p>
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