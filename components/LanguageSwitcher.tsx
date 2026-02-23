"use client";

import { useLanguage } from "@/lib/language-context";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
          language === "en"
            ? "bg-white text-blue-600 shadow"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => setLanguage("sw")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
          language === "sw"
            ? "bg-white text-green-600 shadow"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        🇰🇪 SW
      </button>
    </div>
  );
}