"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { TeamGrowthGarden } from "@/components/growth/TeamGrowthGarden";
import { MeetingStatusPanelContainer } from "@/components/meetings/MeetingStatusPanelContainer";
import { apiFetch } from "@/lib/client-api";
import type { Employee, FeedbackLog, FeedbackType, MeetingRecord } from "@/lib/types";

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  praise: "칭찬",
  growth: "성장",
  improve: "개선",
  coaching: "코칭",
  other: "기타",
};

const TARGET_STORAGE_KEY = "coaching-target-per-member";
const DEFAULT_TARGET = 4;

export default function DashboardPage() {
  const { actor } = useActor();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<FeedbackLog[]>([]);
  const [allLogs, setAllLogs] = useState<FeedbackLog[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [nowTs] = useState(() => Date.now());

  const [monthlyTargetPerMember, setMonthlyTargetPerMember] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_TARGET;
    const stored = localStorage.getItem(TARGET_STORAGE_KEY);
    const n = stored ? parseInt(stored, 10) : DEFAULT_TARGET;
    return Number.isFinite(n) && n >= 1 && n <= 20 ? n : DEFAULT_TARGET;
  });

  const [targetSaved, setTargetSaved] = useState(false);

  const adjustTarget = (delta: number) => {
    setMonthlyTargetPerMember((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const saveTarget = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TARGET_STORAGE_KEY, String(monthlyTargetPerMember));
    }
    setTargetSaved(true);
    setTimeout(() => setTargetSaved(false), 1500);
  };

  useEffect(() => {
    if (!actor || actor.role !== "MANAGER") return;
    let cancelled = false;
    const loadInEffect = async () => {
      const [membersRes, monthlyRes, allLogsRes, meetingsRes] = await Promise.all([
        apiFetch<{ items: Employee[] }>("/api/members"),
        apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=30&type=all&sort=latest"),
        apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=all&type=all&sort=latest"),
        apiFetch<{ items: MeetingRecord[] }>(`/api/meetings?managerId=${encodeURIComponent(actor.id)}`),
      ]);
      if (cancelled) return;
      const activeMembers = membersRes.items.filter((e) => e.active);
      setEmployees(activeMembers);
      setMonthlyLogs(monthlyRes.items);
      setAllLogs(allLogsRes.items);
      setMeetings(meetingsRes.items ?? []);
    };
    void loadInEffect();
    return () => {
      cancelled = true;
    };
  }, [actor]);

  const coverage = useMemo(() => {
    return employees.map((e) => {
      const count = monthlyLogs.filter((l) => l.employeeId === e.id).length;
      return { id: e.id, name: e.name, count, ratio: Math.min(1, count / monthlyTargetPerMember) };
    });
  }, [employees, monthlyLogs, monthlyTargetPerMember]);

  const summary = useMemo(() => {
    const monthLogs = monthlyLogs.filter(
      (l) => nowTs - new Date(l.createdAt).getTime() <= 31 * 24 * 60 * 60 * 1000,
    );
    return {
      total: monthLogs.length,
      praise: monthLogs.filter((l) => l.type === "praise").length,
      coaching: monthLogs.filter((l) => l.type === "coaching").length,
      improve: monthLogs.filter((l) => l.type === "improve").length,
    };
  }, [monthlyLogs, nowTs]);

  const growthGardenMembers = useMemo(() => {
    return employees.map((e) => {
      const empLogs = allLogs.filter((l) => l.employeeId === e.id);
      const empMeetings = meetings.filter((m) => m.employeeId === e.id);
      const latestLog = empLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const latestMeeting = empMeetings.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())[0];
      const typeLabel = latestLog ? FEEDBACK_TYPE_LABELS[latestLog.type] : "";
      return {
        id: e.id,
        name: e.name,
        feedbackCount: empLogs.length,
        lastMeetingDate: latestMeeting?.meetingDate ?? latestLog?.createdAt,
        recentAction: latestLog ? `${typeLabel} 피드백` : undefined,
      };
    });
  }, [employees, allLogs, meetings]);

  if (actor?.role === "HR") {
    return (
      <div className="rounded-xl border bg-white p-5">
        <p className="text-base text-slate-700">
          HR 계정입니다.{" "}
          <Link href="/hr" className="font-semibold text-slate-900">
            HR 대시보드로 이동
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-700">이번 주 코칭 기록을 남겨보세요. 이번 달 목표: 팀원당</span>
          <div className="inline-flex items-center gap-px rounded-md border border-slate-200 bg-slate-50/80 p-px">
            <button
              type="button"
              onClick={() => adjustTarget(-1)}
              disabled={monthlyTargetPerMember <= 1}
              className="flex h-5 w-5 items-center justify-center rounded-sm text-slate-600 transition hover:bg-[#0070C9] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600"
              aria-label="목표 감소"
            >
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="min-w-[1.25rem] px-0.5 text-center text-xs text-slate-900">
              {monthlyTargetPerMember}
            </span>
            <button
              type="button"
              onClick={() => adjustTarget(1)}
              disabled={monthlyTargetPerMember >= 20}
              className="flex h-5 w-5 items-center justify-center rounded-sm text-slate-600 transition hover:bg-[#0070C9] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600"
              aria-label="목표 증가"
            >
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <span className="text-sm text-slate-700">회</span>
          <button
            type="button"
            onClick={saveTarget}
            className="rounded bg-[#0070C9] px-2.5 py-1 text-xs font-medium text-white transition hover:bg-[#0059A8]"
          >
            저장
          </button>
        </div>
        {targetSaved ? (
          <span className="text-xs font-medium text-emerald-600">저장됨</span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_1fr] lg:items-stretch">
        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <MeetingStatusPanelContainer />
          </div>
        </div>

        <section className="flex min-h-0 flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">팀 코칭 커버리지</h3>
            <div className="mt-3 space-y-2">
              {coverage.map((c) => {
                const isMet = c.count >= monthlyTargetPerMember;
                return (
                  <div key={c.id} className="grid grid-cols-[minmax(80px,110px)_1fr_40px] items-center gap-2 text-sm sm:text-base">
                    <span className="truncate text-slate-700">{c.name}</span>
                    <div className="h-2 overflow-hidden rounded bg-slate-200">
                      <div
                        className={`h-full ${isMet ? "bg-[#0070C9]" : "bg-rose-500"}`}
                        style={{ width: `${Math.round(c.ratio * 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${isMet ? "text-[#0070C9]" : "text-rose-600"}`}>
                      {c.count}/{monthlyTargetPerMember}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">팀장 활동 요약</h3>
            <p className="mt-1 text-sm text-slate-500">이번 달</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
              <p className="rounded bg-slate-50 p-2 text-slate-700">전체 기록: {summary.total}</p>
              <p className="rounded bg-slate-50 p-2 text-slate-700">👍 칭찬: {summary.praise}</p>
              <p className="rounded bg-slate-50 p-2 text-slate-700">💬 코칭: {summary.coaching}</p>
              <p className="rounded bg-slate-50 p-2 text-slate-700">⚠ 개선: {summary.improve}</p>
            </div>
          </div>
        </section>
      </div>

      <TeamGrowthGarden members={growthGardenMembers} />
    </div>
  );
}
