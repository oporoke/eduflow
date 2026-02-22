"use client";

import { useEffect, useState } from "react";

const FONTS = ["Default", "OpenDyslexic", "Arial", "Verdana"];
const FONT_SIZES = ["Small", "Medium", "Large", "Extra Large"];

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [font, setFont] = useState("Default");
  const [fontSize, setFontSize] = useState("Medium");
  const [lineSpacing, setLineSpacing] = useState("Normal");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem("a11y-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      applySettings(settings);
      setHighContrast(settings.highContrast || false);
      setFont(settings.font || "Default");
      setFontSize(settings.fontSize || "Medium");
      setLineSpacing(settings.lineSpacing || "Normal");
    }
  }, []);

  const applySettings = (settings: any) => {
    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Font
    const fontMap: { [key: string]: string } = {
      Default: "inherit",
      OpenDyslexic: "OpenDyslexic, sans-serif",
      Arial: "Arial, sans-serif",
      Verdana: "Verdana, sans-serif",
    };
    root.style.setProperty("--a11y-font", fontMap[settings.font] || "inherit");

    // Font size
    const sizeMap: { [key: string]: string } = {
      Small: "14px",
      Medium: "16px",
      Large: "18px",
      "Extra Large": "22px",
    };
    root.style.setProperty("--a11y-font-size", sizeMap[settings.fontSize] || "16px");

    // Line spacing
    const spacingMap: { [key: string]: string } = {
      Normal: "1.5",
      Relaxed: "1.8",
      Loose: "2.2",
    };
    root.style.setProperty("--a11y-line-height", spacingMap[settings.lineSpacing] || "1.5");
  };

  const saveSettings = (newSettings: any) => {
    localStorage.setItem("a11y-settings", JSON.stringify(newSettings));
    applySettings(newSettings);
  };

  const toggleHighContrast = () => {
    const newVal = !highContrast;
    setHighContrast(newVal);
    saveSettings({ highContrast: newVal, font, fontSize, lineSpacing });
  };

  const changeFont = (f: string) => {
    setFont(f);
    saveSettings({ highContrast, font: f, fontSize, lineSpacing });
  };

  const changeFontSize = (s: string) => {
    setFontSize(s);
    saveSettings({ highContrast, font, fontSize: s, lineSpacing });
  };

  const changeLineSpacing = (s: string) => {
    setLineSpacing(s);
    saveSettings({ highContrast, font, fontSize, lineSpacing: s });
  };

  const speakText = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = document.body.innerText;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const resetSettings = () => {
    localStorage.removeItem("a11y-settings");
    const root = document.documentElement;
    root.classList.remove("high-contrast");
    root.style.removeProperty("--a11y-font");
    root.style.removeProperty("--a11y-font-size");
    root.style.removeProperty("--a11y-line-height");
    setHighContrast(false);
    setFont("Default");
    setFontSize("Medium");
    setLineSpacing("Normal");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 text-xl"
        title="Accessibility Settings"
      >
        ♿
      </button>

      {open && (
        <div className="absolute bottom-14 right-0 w-72 bg-white rounded-xl shadow-xl border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">Accessibility Settings</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">High Contrast</p>
              <p className="text-xs text-gray-400">Improve text visibility</p>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`w-12 h-6 rounded-full transition-colors ${
                highContrast ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                highContrast ? "translate-x-6" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Font */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Font</p>
            <div className="grid grid-cols-2 gap-1">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => changeFont(f)}
                  className={`px-2 py-1.5 rounded text-xs border ${
                    font === f ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Text Size</p>
            <div className="grid grid-cols-2 gap-1">
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => changeFontSize(s)}
                  className={`px-2 py-1.5 rounded text-xs border ${
                    fontSize === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Line Spacing</p>
            <div className="grid grid-cols-3 gap-1">
              {["Normal", "Relaxed", "Loose"].map((s) => (
                <button
                  key={s}
                  onClick={() => changeLineSpacing(s)}
                  className={`px-2 py-1.5 rounded text-xs border ${
                    lineSpacing === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Text to Speech */}
          <button
            onClick={speakText}
            className={`w-full py-2 rounded text-sm mb-2 ${
              speaking
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {speaking ? "🔇 Stop Reading" : "🔊 Read Page Aloud"}
          </button>

          {/* Reset */}
          <button
            onClick={resetSettings}
            className="w-full py-2 rounded text-sm border border-gray-300 hover:bg-gray-50"
          >
            Reset to Default
          </button>
        </div>
      )}
    </div>
  );
}