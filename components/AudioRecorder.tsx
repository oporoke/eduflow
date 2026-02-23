"use client";

import { useEffect, useRef, useState } from "react";
import { UploadButton } from "@/lib/uploadthing";

interface Chapter {
  time: number;
  label: string;
}

interface AudioRecorderProps {
  lessonId: string;
  existingAudio?: any;
  onSaved: () => void;
}

export default function AudioRecorder({ lessonId, existingAudio, onSaved }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(existingAudio?.audioUrl || "");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(existingAudio?.duration || 0);
  const [transcript, setTranscript] = useState(existingAudio?.transcript || "");
  const [chapters, setChapters] = useState<Chapter[]>(existingAudio?.chapters || []);
  const [language, setLanguage] = useState(existingAudio?.language || "en");
  const [newChapterLabel, setNewChapterLabel] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setMessage("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const addChapter = () => {
    if (!newChapterLabel) return;
    setChapters((prev) => [
      ...prev,
      { time: Math.round(currentTime), label: newChapterLabel },
    ].sort((a, b) => a.time - b.time));
    setNewChapterLabel("");
  };

  const removeChapter = (time: number) => {
    setChapters((prev) => prev.filter((c) => c.time !== time));
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setMessage("Uploading recording...");

    // Convert blob to base64 and upload via our API
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/audio/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, lessonId }),
        });
        const data = await res.json();
        if (data.url) {
          await saveAudio(data.url);
        }
      } catch {
        setMessage("Upload failed. Please try again.");
      }
      setUploading(false);
    };
  };

  const saveAudio = async (url?: string) => {
    const finalUrl = url || audioUrl;
    if (!finalUrl) return;

    const res = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        audioUrl: finalUrl,
        duration,
        transcript,
        chapters,
        language,
      }),
    });

    if (res.ok) {
      setMessage("Audio lesson saved!");
      onSaved();
    }
  };

  const deleteAudio = async () => {
    if (!confirm("Delete this audio lesson?")) return;
    await fetch(`/api/audio?lessonId=${lessonId}`, { method: "DELETE" });
    setAudioUrl("");
    setAudioBlob(null);
    setChapters([]);
    setTranscript("");
    setMessage("Audio deleted");
    onSaved();
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <h3 className="font-semibold mb-4">🎙️ Audio Lesson</h3>

      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

      {/* Record or Upload */}
      {!audioUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Option 1: Record directly</p>
            <div className="flex items-center gap-3">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex items-center gap-2"
                >
                  🔴 Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 flex items-center gap-2 animate-pulse"
                >
                  ⏹️ Stop ({formatTime(recordingTime)})
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Option 2: Upload audio file</p>
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]?.url) {
                  setAudioUrl(res[0].url);
                  setMessage("Audio uploaded! Fill in details and save.");
                }
              }}
              onUploadError={() => setMessage("Upload failed")}
            />
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioUrl && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded p-4">
            <p className="text-xs text-gray-500 mb-2">Audio Preview</p>
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
              onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
              onLoadedMetadata={(e) => setDuration(Math.round((e.target as HTMLAudioElement).duration))}
            />
            {duration > 0 && (
              <p className="text-xs text-gray-400 mt-1">Duration: {formatTime(duration)}</p>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Language</label>
            <select
              className="border p-2 rounded text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
              <option value="mixed">Mixed (English & Kiswahili)</option>
            </select>
          </div>

          {/* Chapters */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Chapter Markers</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Chapter label (e.g. Introduction)"
                className="flex-1 border p-2 rounded text-sm"
                value={newChapterLabel}
                onChange={(e) => setNewChapterLabel(e.target.value)}
              />
              <button
                onClick={addChapter}
                className="bg-blue-600 text-white px-3 rounded text-sm hover:bg-blue-700"
              >
                + Add at {formatTime(Math.round(currentTime))}
              </button>
            </div>
            {chapters.length > 0 && (
              <div className="space-y-1">
                {chapters.map((c) => (
                  <div key={c.time} className="flex items-center justify-between bg-blue-50 rounded px-3 py-1.5 text-sm">
                    <span className="text-blue-600 font-mono text-xs">{formatTime(c.time)}</span>
                    <span className="flex-1 ml-3">{c.label}</span>
                    <button onClick={() => removeChapter(c.time)} className="text-red-400 text-xs hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Transcript (optional)</label>
            <textarea
              placeholder="Add a text transcript for accessibility..."
              className="w-full border p-2 rounded text-sm h-24 resize-none"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            {audioBlob ? (
              <button
                onClick={uploadRecording}
                disabled={uploading}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload & Save Recording"}
              </button>
            ) : (
              <button
                onClick={() => saveAudio()}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Save Audio Lesson
              </button>
            )}
            <button
              onClick={() => { setAudioUrl(""); setAudioBlob(null); }}
              className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
            >
              Change Audio
            </button>
            <button
              onClick={deleteAudio}
              className="text-red-400 text-sm hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}