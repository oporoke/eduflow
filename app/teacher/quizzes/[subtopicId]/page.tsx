"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Question = {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

export default function TeacherQuizPage({ params }: { params: Promise<{ subtopicId: string }> }) {
  const { subtopicId } = use(params);
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
  ]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const res = await fetch(`/api/quizzes?subtopicId=${subtopicId}`);
    const data = await res.json();
    setQuizzes(data);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title) return setError("Title is required");
    if (questions.some((q) => !q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD)) {
      return setError("Please fill in all question fields");
    }

    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subtopicId, questions }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Quiz created!");
      setTitle("");
      setQuestions([{ text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" }]);
      fetchQuizzes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {/* Create Quiz */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Quiz</h2>

          <input
            type="text"
            placeholder="Quiz title"
            className="w-full border p-2 rounded mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {questions.map((q, index) => (
            <div key={index} className="border rounded p-4 mb-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm">Question {index + 1}</h3>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(index)} className="text-red-500 text-xs hover:underline">
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Question text"
                className="w-full border p-2 rounded mb-2 text-sm"
                value={q.text}
                onChange={(e) => updateQuestion(index, "text", e.target.value)}
              />

              {(["A", "B", "C", "D"] as const).map((opt) => (
                <input
                  key={opt}
                  type="text"
                  placeholder={`Option ${opt}`}
                  className="w-full border p-2 rounded mb-2 text-sm"
                  value={q[`option${opt}` as keyof Question]}
                  onChange={(e) => updateQuestion(index, `option${opt}` as keyof Question, e.target.value)}
                />
              ))}

              <div className="flex items-center gap-2 mt-2">
                <label className="text-sm text-gray-600">Correct Answer:</label>
                <select
                  className="border p-1 rounded text-sm"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={addQuestion} className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50">
              + Add Question
            </button>
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700">
              Create Quiz
            </button>
          </div>
        </div>

        {/* Existing Quizzes */}
        {quizzes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Existing Quizzes</h2>
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded shadow p-6">
                <h3 className="font-semibold">{quiz.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{quiz.questions.length} questions · {quiz.attempts.length} attempts</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
