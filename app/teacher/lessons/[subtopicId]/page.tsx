"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";

export default function LessonPage({ params }: { params: Promise<{ subtopicId: string }> }) {
  const { subtopicId } = use(params);
  const router = useRouter();
  const [lessons, setLessons] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("TEXT");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageInputType, setImageInputType] = useState<"url" | "upload">("url");
  const [videoInputType, setVideoInputType] = useState<"url" | "upload">("url");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    const res = await fetch(`/api/lessons?subtopicId=${subtopicId}`);
    const data = await res.json();
    setLessons(data);
  };

  const handleSubmit = async () => {
    if (!title) return setError("Title is required");

    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, contentType, text, imageUrl, videoUrl, subtopicId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setMessage("Lesson created!");
      setTitle("");
      setText("");
      setImageUrl("");
      setVideoUrl("");
      setContentType("TEXT");
      fetchLessons();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lessons</h1>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {/* Create Lesson Form */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Lesson</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Lesson title"
              className="w-full border p-2 rounded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <select
              className="w-full border p-2 rounded"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="TEXT">Text</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="MIXED">Mixed</option>
            </select>

            {(contentType === "TEXT" || contentType === "MIXED") && (
              <textarea
                placeholder="Lesson text content"
                className="w-full border p-2 rounded h-32"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}

            {(contentType === "IMAGE" || contentType === "MIXED") && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageInputType("url")}
                    className={`px-3 py-1 rounded text-sm border ${imageInputType === "url" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}
                  >
                    URL
                  </button>
                  <button
                    onClick={() => setImageInputType("upload")}
                    className={`px-3 py-1 rounded text-sm border ${imageInputType === "upload" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}
                  >
                    Upload
                  </button>
                </div>

                {imageInputType === "url" ? (
                  <input
                    type="text"
                    placeholder="Image URL"
                    className="w-full border p-2 rounded"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                ) : (
                  <div>
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          setImageUrl(res[0].url);
                          setMessage("Image uploaded successfully!");
                        }
                      }}
                      onUploadError={(err) => setError(err.message)}
                    />
                    {imageUrl && (
                      <img src={imageUrl} alt="Uploaded" className="mt-2 rounded max-h-32 object-cover" />
                    )}
                  </div>
                )}
              </div>
            )}

            {(contentType === "VIDEO" || contentType === "MIXED") && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoInputType("url")}
                    className={`px-3 py-1 rounded text-sm border ${videoInputType === "url" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}
                  >
                    URL
                  </button>
                  <button
                    onClick={() => setVideoInputType("upload")}
                    className={`px-3 py-1 rounded text-sm border ${videoInputType === "upload" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}
                  >
                    Upload
                  </button>
                </div>

                {videoInputType === "url" ? (
                  <input
                    type="text"
                    placeholder="Video URL (YouTube embed URL)"
                    className="w-full border p-2 rounded"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                ) : (
                  <div>
                    <UploadButton
                      endpoint="videoUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          setVideoUrl(res[0].url);
                          setMessage("Video uploaded successfully!");
                        }
                      }}
                      onUploadError={(err) => setError(err.message)}
                    />
                    {videoUrl && (
                      <video src={videoUrl} controls className="mt-2 rounded max-h-32 w-full" />
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create Lesson
            </button>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <p className="text-gray-500">No lessons yet.</p>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded shadow p-6">
                <h3 className="font-semibold text-lg">{lesson.title}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {lesson.contentType}
                </span>
                {lesson.text && <p className="mt-3 text-gray-700 text-sm">{lesson.text}</p>}
                {lesson.imageUrl && (
                  <img src={lesson.imageUrl} alt={lesson.title} className="mt-3 rounded max-h-48 object-cover" />
                )}
                {lesson.videoUrl && (
                  lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be") ? (
                    <iframe className="mt-3 w-full h-48 rounded" src={lesson.videoUrl} allowFullScreen />
                  ) : (
                    <video src={lesson.videoUrl} controls className="mt-3 rounded w-full max-h-48" />
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}