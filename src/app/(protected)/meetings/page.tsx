"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useActor } from "@/components/actor-provider";
import { getMeetings, deleteMeeting } from "@/lib/meetings";
import type { Meeting, MeetingType } from "@/types/meeting";
import { MeetingList } from "@/components/meetings/MeetingList";

const TYPE_FILTERS: { value: MeetingType | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "goal", label: "연초 목표 면담" },
  { value: "quarterly", label: "분기 점검" },
  { value: "coaching", label: "수시 코칭" },
  { value: "general", label: "기타" },
];

export default function MeetingsPage() {
  const { actor } = useActor();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<MeetingType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");

  const managerId = actor?.id || "";

  useEffect(() => {
    const msg = typeof window !== "undefined" ? sessionStorage.getItem("meeting-toast") : null;
    if (msg) {
      sessionStorage.removeItem("meeting-toast");
      setToast(msg);
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (!managerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMeetings(managerId, typeFilter === "all" ? undefined : typeFilter)
      .then((res) => {
        if (!cancelled) setMeetings(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "면담 목록을 불러오는데 실패했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [managerId, typeFilter]);

  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const q = searchQuery.toLowerCase().trim();
    return meetings.filter((m) => m.employeeName.toLowerCase().includes(q));
  }, [meetings, searchQuery]);

  const refreshMeetings = () => {
    if (!managerId) return;
    getMeetings(managerId, typeFilter === "all" ? undefined : typeFilter)
      .then(setMeetings)
      .catch((e) => setError(e instanceof Error ? e.message : "면담 목록을 불러오는데 실패했습니다."));
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("이 면담 기록을 삭제하시겠습니까?")) return;
    try {
      await deleteMeeting(id);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("meeting-toast", "면담 기록이 삭제되었습니다.");
      }
      setToast("면담 기록이 삭제되었습니다.");
      setTimeout(() => setToast(""), 3000);
      refreshMeetings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  if (!managerId) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
        로그인 후 면담 기록을 이용할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">1:1 면담 기록</h1>
        <Link
          href="/meetings/new"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#0070C9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0059A8]"
        >
          면담 기록 작성
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="팀원명 검색"
          className="max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                typeFilter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          면담 목록을 불러오는 중...
        </div>
      ) : (
        <MeetingList
          meetings={filteredMeetings}
          onDelete={actor?.role === "HR" ? undefined : handleDeleteMeeting}
        />
      )}
    </div>
  );
}
