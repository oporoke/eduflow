"use client";

import { useEffect, useRef, useState } from "react";

interface Chapter {
  time: number;
  label: string;
}

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  chapters?: Chapter[];
  transcript?: string;
  language?: string;
}

export default function AudioPlayer({ audioUrl, duration, chapters = [], transcript, language }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (chapters.length > 0) {
      const active = [...chapters]
        .reverse()
        .find((c) => c.time <= currentTime);
      setCurrentChapter(active || null);
    }
  }, [currentTime, chapters]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const seekToChapter = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const languageLabel: { [key: string]: string } = {
    en: "🇬🇧 English",
    sw: "🇰🇪 Kiswahili",
    mixed: "🇰🇪 Mixed",
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎙️</span>
        <div>
          <p className="font-semibold text-blue-800">Audio Lesson</p>
          {language && (
            <p className="text-xs text-blue-500">{languageLabel[language] || language}</p>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setTotalDuration((e.target as HTMLAudioElement).duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Current Chapter */}
      {currentChapter && (
        <div className="bg-blue-100 rounded px-3 py-1.5 mb-3 text-sm text-blue-700 font-medium">
          📍 {currentChapter.label}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          value={currentTime}
          onChange={seek}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Rewind 10s */}
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="Rewind 10s"
          >
            ⏪ 10s
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 text-xl shadow"
          >
            {playing ? "⏸" : "▶️"}
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="Forward 10s"
          >
            10s ⏩
          </button>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Speed:</span>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackRate(speed)}
              className={`text-xs px-2 py-1 rounded ${
                playbackRate === speed
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">CHAPTERS</p>
          <div className="space-y-1">
            {chapters.map((c) => (
              <button
                key={c.time}
                onClick={() => seekToChapter(c.time)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-blue-100 transition ${
                  currentChapter?.time === c.time ? "bg-blue-100 font-medium" : ""
                }`}
              >
                <span className="text-blue-500 font-mono text-xs w-10 flex-shrink-0">
                  {formatTime(c.time)}
                </span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs text-blue-600 hover:underline mb-2"
          >
            {showTranscript ? "Hide Transcript ▲" : "Show Transcript ▼"}
          </button>
          {showTranscript && (
            <div className="bg-white rounded p-3 text-sm text-gray-700 max-h-48 overflow-y-auto border">
              <p className="whitespace-pre-line">{transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}