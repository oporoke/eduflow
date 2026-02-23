"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const QUICK_PROMPTS = [
  "Explain this topic in simple terms",
  "Give me an example I can relate to",
  "I don't understand — can you explain differently?",
  "What are the key points I should remember?",
  "Can you give me a practice question?",
  "How does this apply in real life?",
  "What is the step-by-step method?",
  "Summarize what we just covered",
];

interface Message {
  role: "user" | "model";
  content: string;
}

function TutorChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId") || "";
  const topicId = searchParams.get("topicId") || "";
  const subjectName = searchParams.get("subject") || "";
  const topicName = searchParams.get("topic") || "";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `👋 Hi! I'm **EduBot**, your personal AI tutor.\n\n${
        topicName
          ? `I can see you're studying **${topicName}**${subjectName ? ` in ${subjectName}` : ""}. `
          : subjectName
          ? `I can see you're studying **${subjectName}**. `
          : ""
      }Ask me anything — I'm here to help you understand, not just give you answers. What would you like to learn today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          subjectId,
          topicId,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, I had trouble responding. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
            🤖
          </div>
          <div>
            <h1 className="font-bold">EduBot — AI Tutor</h1>
            {(subjectName || topicName) && (
              <p className="text-xs text-gray-500">
                {subjectName}{topicName ? ` · ${topicName}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setMessages([{
              role: "model",
              content: "👋 Hi again! I've cleared our conversation. What would you like to learn?",
            }])}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear Chat
          </button>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "model" && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 mt-1">
                🤖
              </div>
            )}
            <div
              className={`max-w-lg rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white border shadow-sm rounded-tl-none"
              }`}
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
            />
            {msg.role === "user" && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1">
                👤
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm mr-2">
              🤖
            </div>
            <div className="bg-white border shadow-sm rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="flex-shrink-0 text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:bg-blue-50 hover:border-blue-300 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            placeholder="Ask EduBot anything..."
            className="flex-1 border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <TutorChat />
    </Suspense>
  );
}