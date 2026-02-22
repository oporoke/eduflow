"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [terms, setTerms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  const [showTermForm, setShowTermForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [termForm, setTermForm] = useState({ name: "", startDate: "", endDate: "" });
  const [planForm, setPlanForm] = useState({ weekNumber: 1, subjectId: "", topicId: "", notes: "" });
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [termsRes, subjectsRes] = await Promise.all([
      fetch(`/api/calendar?classroomId=${classroomId}`),
      fetch(`/api/subjects?classroomId=${classroomId}`),
    ]);
    const termsData = await termsRes.json();
    const subjectsData = await subjectsRes.json();
    setTerms(termsData);
    setSubjects(subjectsData);
    if (termsData.length > 0) setActiveTerm(termsData[0]);
  };

  const createTerm = async () => {
    if (!termForm.name || !termForm.startDate || !termForm.endDate) return;
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...termForm, classroomId }),
    });
    if (res.ok) {
      setMessage("Term created!");
      setShowTermForm(false);
      setTermForm({ name: "", startDate: "", endDate: "" });
      fetchData();
    }
  };

  const addWeekPlan = async () => {
    if (!planForm.subjectId || !planForm.topicId) return;
    const res = await fetch("/api/calendar/weekplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...planForm, termId: activeTerm.id }),
    });
    if (res.ok) {
      setMessage("Week plan added!");
      setShowPlanForm(false);
      setPlanForm({ weekNumber: 1, subjectId: "", topicId: "", notes: "" });
      fetchData();
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await fetch("/api/calendar/weekplan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed: !completed }),
    });
    fetchData();
  };

  const deletePlan = async (id: string) => {
    await fetch(`/api/calendar/weekplan?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleSubjectChange = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    setAvailableTopics(subject?.topics || []);
    setPlanForm((prev) => ({ ...prev, subjectId, topicId: "" }));
  };

  const termWeeks = activeTerm
    ? Math.ceil(
        (new Date(activeTerm.endDate).getTime() - new Date(activeTerm.startDate).getTime()) /
          (1000 * 60 * 60 * 24 * 7)
      )
    : 0;

  const completedPlans = activeTerm?.weekPlans?.filter((p: any) => p.completed).length || 0;
  const totalPlans = activeTerm?.weekPlans?.length || 0;
  const coveragePercentage = totalPlans ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // Group plans by week
  const plansByWeek: { [week: number]: any[] } = {};
  activeTerm?.weekPlans?.forEach((p: any) => {
    if (!plansByWeek[p.weekNumber]) plansByWeek[p.weekNumber] = [];
    plansByWeek[p.weekNumber].push(p);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">School Calendar</h1>
            <p className="text-gray-500 text-sm">Plan and track syllabus coverage per term</p>
          </div>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Terms */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {terms.map((term) => (
            <button
              key={term.id}
              onClick={() => setActiveTerm(term)}
              className={`px-4 py-1.5 rounded text-sm border ${
                activeTerm?.id === term.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {term.name}
            </button>
          ))}
          <button
            onClick={() => setShowTermForm(!showTermForm)}
            className="px-4 py-1.5 rounded text-sm border border-dashed border-gray-300 hover:bg-gray-50"
          >
            + New Term
          </button>
        </div>

        {/* New Term Form */}
        {showTermForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Term</h2>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Term name (e.g. Term 1 2025)"
                className="border p-2 rounded text-sm"
                value={termForm.name}
                onChange={(e) => setTermForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="date"
                className="border p-2 rounded text-sm"
                value={termForm.startDate}
                onChange={(e) => setTermForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
              <input
                type="date"
                className="border p-2 rounded text-sm"
                value={termForm.endDate}
                onChange={(e) => setTermForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <button
              onClick={createTerm}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Create Term
            </button>
          </div>
        )}

        {activeTerm && (
          <>
            {/* Coverage Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded shadow p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{termWeeks}</p>
                <p className="text-xs text-gray-500 mt-1">Total Weeks</p>
              </div>
              <div className="bg-white rounded shadow p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{totalPlans}</p>
                <p className="text-xs text-gray-500 mt-1">Topics Planned</p>
              </div>
              <div className="bg-white rounded shadow p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{completedPlans}</p>
                <p className="text-xs text-gray-500 mt-1">Topics Covered</p>
              </div>
              <div className="bg-white rounded shadow p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{coveragePercentage}%</p>
                <p className="text-xs text-gray-500 mt-1">Coverage</p>
              </div>
            </div>

            {/* Coverage Bar */}
            <div className="bg-white rounded shadow p-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Syllabus Coverage</span>
                <span>{completedPlans}/{totalPlans} topics</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    coveragePercentage >= 80 ? "bg-green-500" :
                    coveragePercentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${coveragePercentage}%` }}
                />
              </div>
            </div>

            {/* Add Week Plan */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Weekly Plan — {activeTerm.name}</h2>
              <button
                onClick={() => setShowPlanForm(!showPlanForm)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
              >
                + Add Week Plan
              </button>
            </div>

            {showPlanForm && (
              <div className="bg-white rounded shadow p-6 mb-6">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Week Number</label>
                    <input
                      type="number"
                      min={1}
                      max={termWeeks}
                      className="w-full border p-2 rounded text-sm"
                      value={planForm.weekNumber}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, weekNumber: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                    <select
                      className="w-full border p-2 rounded text-sm"
                      value={planForm.subjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Topic</label>
                    <select
                      className="w-full border p-2 rounded text-sm"
                      value={planForm.topicId}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, topicId: e.target.value }))}
                    >
                      <option value="">Select topic</option>
                      {availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="Any notes..."
                      className="w-full border p-2 rounded text-sm"
                      value={planForm.notes}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  onClick={addWeekPlan}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Add Plan
                </button>
              </div>
            )}

            {/* Weekly Grid */}
            {Object.keys(plansByWeek).length === 0 ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📅</p>
                <p>No plans yet. Click + Add Week Plan to start planning your term.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(plansByWeek)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([week, plans]) => (
                    <div key={week} className="bg-white rounded shadow p-6">
                      <h3 className="font-semibold mb-3 text-blue-600">Week {week}</h3>
                      <div className="space-y-2">
                        {plans.map((plan: any) => (
                          <div
                            key={plan.id}
                            className={`flex items-center justify-between p-3 rounded border ${
                              plan.completed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={plan.completed}
                                onChange={() => toggleComplete(plan.id, plan.completed)}
                                className="accent-green-500 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <p className={`text-sm font-medium ${plan.completed ? "line-through text-gray-400" : ""}`}>
                                  {plan.topic?.name}
                                </p>
                                <p className="text-xs text-gray-400">{plan.subject?.name}</p>
                                {plan.notes && (
                                  <p className="text-xs text-gray-500 italic">{plan.notes}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deletePlan(plan.id)}
                              className="text-red-400 text-xs hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}