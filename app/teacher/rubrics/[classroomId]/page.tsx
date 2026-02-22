"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Criteria = {
  name: string;
  description: string;
  maxScore: number;
  weight: number;
};

export default function RubricBuilderPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<Criteria[]>([
    { name: "", description: "", maxScore: 4, weight: 1 },
  ]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRubrics();
  }, []);

  const fetchRubrics = async () => {
    const res = await fetch(`/api/rubrics?classroomId=${classroomId}`);
    const data = await res.json();
    setRubrics(data);
  };

  const addCriteria = () => {
    setCriteria((prev) => [...prev, { name: "", description: "", maxScore: 4, weight: 1 }]);
  };

  const removeCriteria = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCriteria = (index: number, field: keyof Criteria, value: any) => {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const createRubric = async () => {
    if (!title || criteria.some((c) => !c.name)) return;
    const res = await fetch("/api/rubrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, classroomId, criteria }),
    });
    if (res.ok) {
      setMessage("Rubric created!");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setCriteria([{ name: "", description: "", maxScore: 4, weight: 1 }]);
      fetchRubrics();
    }
  };

  const scoreLabels: { [key: number]: string } = {
    1: "Beginning",
    2: "Developing",
    3: "Achieving",
    4: "Excelling",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rubric Builder</h1>
            <p className="text-gray-500 text-sm">Create structured grading criteria for assignments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Rubric
            </button>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Rubric Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Rubric</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Rubric title (e.g. Science Project Rubric)"
                className="w-full border p-2 rounded text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                placeholder="Description (optional)"
                className="w-full border p-2 rounded text-sm h-16 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-sm">Criteria</h3>
                  <button
                    onClick={addCriteria}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    + Add Criteria
                  </button>
                </div>

                <div className="space-y-3">
                  {criteria.map((c, index) => (
                    <div key={index} className="border rounded p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium">Criteria {index + 1}</h4>
                        {criteria.length > 1 && (
                          <button
                            onClick={() => removeCriteria(index)}
                            className="text-red-400 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Criteria name (e.g. Content Quality)"
                          className="border p-2 rounded text-sm"
                          value={c.name}
                          onChange={(e) => updateCriteria(index, "name", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          className="border p-2 rounded text-sm"
                          value={c.description}
                          onChange={(e) => updateCriteria(index, "description", e.target.value)}
                        />
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Max Score</label>
                          <select
                            className="w-full border p-2 rounded text-sm"
                            value={c.maxScore}
                            onChange={(e) => updateCriteria(index, "maxScore", parseInt(e.target.value))}
                          >
                            {[3, 4, 5, 10].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Weight</label>
                          <select
                            className="w-full border p-2 rounded text-sm"
                            value={c.weight}
                            onChange={(e) => updateCriteria(index, "weight", parseInt(e.target.value))}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n}x</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={createRubric}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Create Rubric
              </button>
            </div>
          </div>
        )}

        {/* Rubrics List */}
        {rubrics.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p>No rubrics yet. Create one to use structured grading on assignments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rubrics.map((rubric) => (
              <div key={rubric.id} className="bg-white rounded shadow p-6">
                <h3 className="font-semibold mb-1">{rubric.title}</h3>
                {rubric.description && (
                  <p className="text-sm text-gray-500 mb-3">{rubric.description}</p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2 text-left font-medium">Criteria</th>
                        {Array.from({ length: rubric.criteria[0]?.maxScore || 4 }, (_, i) => (
                          <th key={i} className="border p-2 text-center font-medium">
                            {scoreLabels[i + 1] || `Score ${i + 1}`}
                          </th>
                        ))}
                        <th className="border p-2 text-center font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubric.criteria.map((c: any) => (
                        <tr key={c.id}>
                          <td className="border p-2 font-medium">{c.name}</td>
                          {Array.from({ length: c.maxScore }, (_, i) => (
                            <td key={i} className="border p-2 text-center text-gray-500">
                              {i + 1}
                            </td>
                          ))}
                          <td className="border p-2 text-center">{c.weight}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {rubric.criteria.length} criteria · Used in {rubric.assignments?.length || 0} assignments
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}