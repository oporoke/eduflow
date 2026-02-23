"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function StudyGroupsPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", subjectId: "" });
  const [postContent, setPostContent] = useState("");
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [groupsRes, subjectsRes] = await Promise.all([
      fetch(`/api/study-groups?classroomId=${classroomId}`),
      fetch(`/api/subjects?classroomId=${classroomId}`),
    ]);
    const groupsData = await groupsRes.json();
    const subjectsData = await subjectsRes.json();
    setGroups(groupsData);
    setSubjects(subjectsData);
    if (selectedGroup) {
      const updated = groupsData.find((g: any) => g.id === selectedGroup.id);
      if (updated) setSelectedGroup(updated);
    }
  };

  const createGroup = async () => {
    if (!form.name) return;
    await fetch("/api/study-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classroomId }),
    });
    setMessage("Group created!");
    setShowForm(false);
    setForm({ name: "", description: "", subjectId: "" });
    fetchData();
  };

  const joinGroup = async (groupId: string) => {
    await fetch("/api/study-groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    fetchData();
  };

  const leaveGroup = async (groupId: string) => {
    await fetch(`/api/study-groups/join?groupId=${groupId}`, { method: "DELETE" });
    setSelectedGroup(null);
    fetchData();
  };

  const postMessage = async () => {
    if (!postContent.trim() || !selectedGroup) return;
    await fetch("/api/study-groups/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: selectedGroup.id, content: postContent }),
    });
    setPostContent("");
    fetchData();
  };

  const postReply = async (postId: string) => {
    if (!replyContent[postId]?.trim()) return;
    await fetch("/api/study-groups/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reply", postId, content: replyContent[postId] }),
    });
    setReplyContent((prev) => ({ ...prev, [postId]: "" }));
    fetchData();
  };

  const upvotePost = async (postId: string) => {
    await fetch("/api/study-groups/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "upvote", postId }),
    });
    fetchData();
  };

  const pinPost = async (postId: string) => {
    await fetch("/api/study-groups/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pin", postId }),
    });
    fetchData();
  };

  const deletePost = async (postId: string) => {
    await fetch(`/api/study-groups/posts?id=${postId}`, { method: "DELETE" });
    fetchData();
  };

  // Leaderboard
  const leaderboard = selectedGroup?.posts?.reduce((acc: any, post: any) => {
    const name = post.author?.name;
    if (!acc[name]) acc[name] = { name, posts: 0, upvotes: 0 };
    acc[name].posts += 1;
    acc[name].upvotes += post.upvotes;
    post.replies?.forEach((r: any) => {
      const rName = r.author?.name;
      if (!acc[rName]) acc[rName] = { name: rName, posts: 0, upvotes: 0 };
      acc[rName].posts += 1;
    });
    return acc;
  }, {});

  const leaderboardList = leaderboard
    ? Object.values(leaderboard).sort((a: any, b: any) => (b.upvotes + b.posts) - (a.upvotes + a.posts))
    : [];

  const myGroups = groups.filter((g) => g.isMember);
  const otherGroups = groups.filter((g) => !g.isMember);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Study Groups</h1>
            <p className="text-gray-500 text-sm">Collaborate with classmates and learn together</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Create Group
            </button>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
              Back
            </button>
          </div>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Create Group Form */}
        {showForm && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Create Study Group</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Group name (e.g. Biology Revision Team)"
                className="w-full border p-2 rounded text-sm"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <textarea
                placeholder="What will this group focus on?"
                className="w-full border p-2 rounded text-sm h-16 resize-none"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
              <select
                className="w-full border p-2 rounded text-sm"
                value={form.subjectId}
                onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
              >
                <option value="">All subjects (General)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={createGroup}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
              >
                Create Group
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Groups Sidebar */}
          <div className="col-span-1 space-y-4">
            {/* My Groups */}
            {myGroups.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm text-gray-600 mb-2">My Groups ({myGroups.length})</h2>
                <div className="space-y-2">
                  {myGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                        selectedGroup?.id === group.id ? "border-blue-500" : "border-green-400"
                      }`}
                    >
                      <h3 className="font-medium text-sm">{group.name}</h3>
                      {group.subject && (
                        <p className="text-xs text-blue-500">{group.subject.name}</p>
                      )}
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>👥 {group.memberCount}</span>
                        <span>💬 {group.postCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Groups */}
            {otherGroups.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm text-gray-600 mb-2">Available Groups ({otherGroups.length})</h2>
                <div className="space-y-2">
                  {otherGroups.map((group) => (
                    <div key={group.id} className="bg-white rounded shadow p-4 border-l-4 border-gray-200">
                      <h3 className="font-medium text-sm">{group.name}</h3>
                      {group.subject && (
                        <p className="text-xs text-blue-500">{group.subject.name}</p>
                      )}
                      {group.description && (
                        <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">👥 {group.memberCount} members</span>
                        <button
                          onClick={() => joinGroup(group.id)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groups.length === 0 && (
              <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm">No groups yet — create the first one!</p>
              </div>
            )}
          </div>

          {/* Group Chat */}
          <div className="col-span-2">
            {!selectedGroup ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">💬</p>
                <p>Select or join a group to start collaborating</p>
              </div>
            ) : !selectedGroup.isMember ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">🔒</p>
                <p className="mb-4">Join this group to see discussions</p>
                <button
                  onClick={() => joinGroup(selectedGroup.id)}
                  className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Join Group
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group Header */}
                <div className="bg-white rounded shadow p-4 flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold">{selectedGroup.name}</h2>
                    <p className="text-xs text-gray-400">
                      {selectedGroup.memberCount} members · {selectedGroup.postCount} posts
                      {selectedGroup.subject && ` · ${selectedGroup.subject.name}`}
                    </p>
                  </div>
                  <button
                    onClick={() => leaveGroup(selectedGroup.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Leave Group
                  </button>
                </div>

                {/* Leaderboard */}
                {leaderboardList.length > 0 && (
                  <div className="bg-white rounded shadow p-4">
                    <h3 className="font-medium text-sm mb-2">🏆 Top Contributors</h3>
                    <div className="flex gap-3">
                      {leaderboardList.slice(0, 3).map((member: any, i) => (
                        <div key={member.name} className="flex items-center gap-1 text-xs">
                          <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-gray-400">({member.upvotes} ⬆️)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedGroup.posts?.length === 0 ? (
                    <div className="bg-white rounded shadow p-6 text-center text-gray-400">
                      <p className="text-3xl mb-2">💬</p>
                      <p className="text-sm">No posts yet — start the discussion!</p>
                    </div>
                  ) : (
                    selectedGroup.posts?.map((post: any) => (
                      <div
                        key={post.id}
                        className={`bg-white rounded shadow p-4 ${post.pinned ? "border-l-4 border-yellow-400" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {post.author?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{post.author?.name}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(post.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.pinned && <span className="text-xs text-yellow-600">📌 Pinned</span>}
                            {(role === "TEACHER" || role === "ADMIN") && (
                              <button
                                onClick={() => pinPost(post.id)}
                                className="text-xs text-gray-400 hover:underline"
                              >
                                {post.pinned ? "Unpin" : "Pin"}
                              </button>
                            )}
                            {post.author?.id === userId && (
                              <button
                                onClick={() => deletePost(post.id)}
                                className="text-xs text-red-400 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{post.content}</p>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => upvotePost(post.id)}
                            className={`flex items-center gap-1 text-xs ${
                              post.upvotedBy?.some((u: any) => u.userId === userId)
                                ? "text-blue-600 font-medium"
                                : "text-gray-400 hover:text-blue-600"
                            }`}
                          >
                            ⬆️ {post.upvotes}
                          </button>
                          <button
                            onClick={() => setShowReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="text-xs text-gray-400 hover:text-blue-600"
                          >
                            💬 {post.replies?.length || 0} replies
                          </button>
                        </div>

                        {/* Replies */}
                        {showReplies[post.id] && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
                            {post.replies?.map((reply: any) => (
                              <div key={reply.id} className="bg-gray-50 rounded p-2">
                                <p className="text-xs font-medium text-gray-600">{reply.author?.name}</p>
                                <p className="text-sm text-gray-700">{reply.content}</p>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                className="flex-1 border p-1.5 rounded text-xs"
                                value={replyContent[post.id] || ""}
                                onChange={(e) => setReplyContent((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") postReply(post.id); }}
                              />
                              <button
                                onClick={() => postReply(post.id)}
                                className="bg-blue-600 text-white px-3 rounded text-xs hover:bg-blue-700"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Post Input */}
                <div className="bg-white rounded shadow p-4">
                  <textarea
                    placeholder="Share a note, ask a question or post a resource..."
                    className="w-full border rounded p-3 text-sm h-20 resize-none mb-3"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postMessage(); } }}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">Press Enter to post · Shift+Enter for new line</p>
                    <button
                      onClick={postMessage}
                      disabled={!postContent.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}