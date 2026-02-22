"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Compassionate", "Study", "Other"];

export default function StaffManagementPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState<any>({});
  const [reviewForm, setReviewForm] = useState({ period: "", rating: 5, comments: "", goals: "" });
  const [leaveApplications, setLeaveApplications] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStaff();
    fetchLeaveApplications();
  }, []);

  const fetchStaff = async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data);
  };

  const fetchLeaveApplications = async () => {
    const res = await fetch("/api/staff/leave");
    const data = await res.json();
    setLeaveApplications(data);
  };

  const selectStaff = (member: any) => {
    setSelected(member);
    setProfileForm({
      staffNumber: member.staffProfile?.staffNumber || "",
      department: member.staffProfile?.department || "",
      designation: member.staffProfile?.designation || "",
      qualification: member.staffProfile?.qualification || "",
      dateJoined: member.staffProfile?.dateJoined?.split("T")[0] || "",
      dateOfBirth: member.staffProfile?.dateOfBirth?.split("T")[0] || "",
      phone: member.staffProfile?.phone || "",
      address: member.staffProfile?.address || "",
      emergencyContact: member.staffProfile?.emergencyContact || "",
    });
  };

  const saveProfile = async () => {
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected.id, ...profileForm }),
    });
    setMessage("Profile saved!");
    fetchStaff();
  };

  const submitReview = async () => {
    if (!reviewForm.period) return;
    await fetch("/api/staff/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: selected.staffProfile?.id, ...reviewForm }),
    });
    setMessage("Review submitted!");
    setReviewForm({ period: "", rating: 5, comments: "", goals: "" });
    fetchStaff();
  };

  const reviewLeave = async (applicationId: string, status: string) => {
    await fetch("/api/staff/leave", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    setMessage(`Leave ${status.toLowerCase()}!`);
    fetchLeaveApplications();
  };

  const pendingLeave = leaveApplications.filter((l) => l.status === "PENDING");

  const STATUS_COLORS: { [key: string]: string } = {
    PENDING: "bg-yellow-100 text-yellow-600",
    APPROVED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  const ratingColors: { [key: number]: string } = {
    1: "text-red-500", 2: "text-orange-500", 3: "text-yellow-500",
    4: "text-blue-500", 5: "text-green-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-gray-500 text-sm">Manage teacher profiles, leave and performance</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
            Back
          </button>
        </div>

        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        {/* Pending Leave Banner */}
        {pendingLeave.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <p className="text-yellow-700 font-medium text-sm">
              ⏳ {pendingLeave.length} pending leave application{pendingLeave.length > 1 ? "s" : ""} require your review
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Staff List */}
          <div className="col-span-1 space-y-3">
            <h2 className="font-semibold text-sm text-gray-600 mb-2">
              Teachers ({staff.length})
            </h2>
            {staff.map((member) => (
              <div
                key={member.id}
                onClick={() => selectStaff(member)}
                className={`bg-white rounded shadow p-4 cursor-pointer hover:shadow-md transition border-l-4 ${
                  selected?.id === member.id ? "border-blue-500" : "border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-gray-400">
                      {member.staffProfile?.designation || "Teacher"}
                    </p>
                    {member.staffProfile?.department && (
                      <p className="text-xs text-gray-400">{member.staffProfile.department}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Staff Detail */}
          <div className="col-span-2">
            {!selected ? (
              <div className="bg-white rounded shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">👤</p>
                <p>Select a staff member to view details</p>
              </div>
            ) : (
              <div className="bg-white rounded shadow p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <p className="text-gray-500 text-sm">{selected.email}</p>
                    {selected.staffProfile?.staffNumber && (
                      <p className="text-xs text-gray-400">Staff #{selected.staffProfile.staffNumber}</p>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  {["profile", "leave", "reviews"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded text-sm capitalize border ${
                        activeTab === tab
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Staff Number</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.staffNumber}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, staffNumber: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Department</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.department}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, department: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Designation</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.designation}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, designation: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Qualification</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.qualification}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, qualification: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Date Joined</label>
                        <input
                          type="date"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.dateJoined}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, dateJoined: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Date of Birth</label>
                        <input
                          type="date"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.dateOfBirth}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Emergency Contact</label>
                        <input
                          type="text"
                          className="w-full border p-2 rounded text-sm"
                          value={profileForm.emergencyContact}
                          onChange={(e) => setProfileForm((prev: any) => ({ ...prev, emergencyContact: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Address</label>
                      <textarea
                        className="w-full border p-2 rounded text-sm h-16 resize-none"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm((prev: any) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Save Profile
                    </button>
                  </div>
                )}

                {/* Leave Tab */}
                {activeTab === "leave" && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Leave Applications</h3>
                    {selected.staffProfile?.leaveApplications?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No leave applications</p>
                    ) : (
                      <div className="space-y-3">
                        {selected.staffProfile?.leaveApplications?.map((leave: any) => (
                          <div key={leave.id} className="border rounded p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{leave.type} Leave</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(leave.startDate).toLocaleDateString()} —{" "}
                                  {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[leave.status]}`}>
                                  {leave.status}
                                </span>
                                {leave.status === "PENDING" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => reviewLeave(leave.id, "APPROVED")}
                                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => reviewLeave(leave.id, "REJECTED")}
                                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-semibold text-sm mb-3">Add Performance Review</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Review Period</label>
                            <input
                              type="text"
                              placeholder="e.g. Term 1 2025"
                              className="w-full border p-2 rounded text-sm"
                              value={reviewForm.period}
                              onChange={(e) => setReviewForm((prev) => ({ ...prev, period: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Rating: {reviewForm.rating}/5
                            </label>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              className="w-full"
                              value={reviewForm.rating}
                              onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: parseInt(e.target.value) }))}
                            />
                          </div>
                        </div>
                        <textarea
                          placeholder="Performance comments..."
                          className="w-full border p-2 rounded text-sm h-20 resize-none"
                          value={reviewForm.comments}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, comments: e.target.value }))}
                        />
                        <textarea
                          placeholder="Goals for next period..."
                          className="w-full border p-2 rounded text-sm h-20 resize-none"
                          value={reviewForm.goals}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, goals: e.target.value }))}
                        />
                        <button
                          onClick={submitReview}
                          className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm mb-3">Review History</h3>
                    {selected.staffProfile?.performanceReviews?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No reviews yet</p>
                    ) : (
                      <div className="space-y-3">
                        {selected.staffProfile?.performanceReviews?.map((review: any) => (
                          <div key={review.id} className="border rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium text-sm">{review.period}</p>
                              <span className={`text-2xl font-bold ${ratingColors[review.rating]}`}>
                                {review.rating}/5
                              </span>
                            </div>
                            {review.comments && (
                              <p className="text-sm text-gray-600 mb-2">{review.comments}</p>
                            )}
                            {review.goals && (
                              <div className="bg-blue-50 rounded p-2">
                                <p className="text-xs text-gray-500 mb-1">Goals:</p>
                                <p className="text-sm text-gray-700">{review.goals}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}