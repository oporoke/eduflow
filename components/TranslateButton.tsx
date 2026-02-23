"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";

interface TranslateButtonProps {
  text: string;
  onTranslated: (translated: string) => void;
  className?: string;
}

export default function TranslateButton({ text, onTranslated, className }: TranslateButtonProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [originalText] = useState(text);

  const translate = async () => {
    if (translated) {
      onTranslated(originalText);
      setTranslated(false);
      return;
    }

    setLoading(true);
    const targetLanguage = language === "en" ? "sw" : "en";

    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.translated) {
      onTranslated(data.translated);
      setTranslated(true);
    }
  };

  return (
    <button
      onClick={translate}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition ${
        translated
          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
      } disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <span className="animate-spin">⟳</span>
          <span>Translating...</span>
        </>
      ) : translated ? (
        <>
          <span>🇬🇧</span>
          <span>Show Original</span>
        </>
      ) : (
        <>
          <span>🇰🇪</span>
          <span>Tafsiri kwa Kiswahili</span>
        </>
      )}
    </button>
  );
}