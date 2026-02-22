"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setInstalled(true);
    }
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-xl border p-4 z-50">
      <div className="flex items-start gap-3">
        <img src="/icons/icon-72x72.png" alt="EduFlow" className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install EduFlow</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Add to your home screen for quick access and offline use
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs hover:bg-blue-700"
            >
              Install
            </button>
            <button
              onClick={() => setShow(false)}
              className="border border-gray-300 px-4 py-1.5 rounded text-xs hover:bg-gray-50"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}