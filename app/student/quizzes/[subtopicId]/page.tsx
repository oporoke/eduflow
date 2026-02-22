"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function StudentQuizPage({ params }: { params: Promise<{ subtopicId: string }> }) {
  const { subtopicId } = use(params);
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const res = await fetch(`/api/quizzes?subtopicId=${subtopicId}`);
    const data = await res.json();
    setQuizzes(data);
  };

  const startQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setResult(null);
  };

  const submitQuiz = async () => {
    if (Object.keys(answers).length < activeQuiz.questions.length) {
      setMessage("Please answer all questions before submitting");
      return;
    }

    const res = await fetch("/api/quizzes/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: activeQuiz.id, answers }),
    });

    const data = await res.json();
    setResult(data);
    setActiveQuiz(null);
    fetchQuizzes();
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

        {message && <p className="text-red-500 mb-4 text-sm">{message}</p>}

        {/* Quiz Result */}
        {result && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Quiz Result</h2>
            <p className="text-3xl font-bold text-blue-600 mb-1">
              {result.score}/{result.total}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {Math.round((result.score / result.total) * 100)}% correct
            </p>

            <div className="space-y-4">
              {result.questions.map((q: any) => {
                const userAnswer = result.answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                  <div key={q.id} className={`p-4 rounded border-l-4 ${isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
                    <p className="font-medium text-sm mb-2">{q.text}</p>
                    <p className="text-sm">Your answer: <span className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{userAnswer} — {q[`option${userAnswer}`]}</span></p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600">Correct: {q.correctAnswer} — {q[`option${q.correctAnswer}`]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setResult(null)}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Back to Quizzes
            </button>
          </div>
        )}

        {/* Active Quiz */}
        {activeQuiz && !result && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{activeQuiz.title}</h2>

            <div className="space-y-6">
              {activeQuiz.questions.map((q: any, index: number) => (
                <div key={q.id}>
                  <p className="font-medium text-sm mb-3">{index + 1}. {q.text}</p>
                  <div className="space-y-2">
                    {(["A", "B", "C", "D"] as const).map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                          answers[q.id] === opt ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">{opt}. {q[`option${opt}`]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={submitQuiz}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Submit Quiz
              </button>
              <button
                onClick={() => setActiveQuiz(null)}
                className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quiz List */}
        {!activeQuiz && !result && (
          <div className="space-y-4">
            {quizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes available yet.</p>
            ) : (
              quizzes.map((quiz) => {
                const attempt = quiz.attempts?.[0];
                return (
                  <div key={quiz.id} className="bg-white rounded shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{quiz.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{quiz.questions.length} questions</p>
                        {attempt && (
                          <p className="text-sm text-green-600 mt-1">
                            Best score: {attempt.score}/{attempt.total} ({Math.round((attempt.score / attempt.total) * 100)}%)
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                      >
                        {attempt ? "Retake" : "Start"}
                      </button>
                    </div>
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
