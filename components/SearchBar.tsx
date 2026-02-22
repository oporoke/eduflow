"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const hasResults =
    results &&
    (results.classes?.length > 0 ||
      results.subjects?.length > 0 ||
      results.lessons?.length > 0);

  return (
    <div ref={ref} className="relative w-64">
      <input
        type="text"
        placeholder="Search classes, lessons..."
        className="w-full border border-gray-300 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-400"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results && setOpen(true)}
      />

      {open && (
        <div className="absolute top-10 left-0 w-full bg-white rounded shadow-lg border z-50 max-h-80 overflow-y-auto">
          {!hasResults ? (
            <p className="text-gray-500 text-sm p-4 text-center">No results found</p>
          ) : (
            <>
              {results.classes?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase font-semibold">Classes</p>
                  {results.classes.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        router.push(`/classes`);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">Teacher: {c.teacher?.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.subjects?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase font-semibold">Subjects</p>
                  {results.subjects.map((s: any) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        router.push(`/classes`);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-400">Class: {s.classroom?.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.lessons?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 px-4 pt-3 pb-1 uppercase font-semibold">Lessons</p>
                  {results.lessons.map((l: any) => (
                    <div
                      key={l.id}
                      onClick={() => {
                        router.push(`/student/lessons/${l.subtopicId}`);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm font-medium">{l.title}</p>
                      <p className="text-xs text-gray-400">
                        {l.subtopic?.topic?.subject?.classroom?.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}