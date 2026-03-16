"use client";

import { useEffect, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { getMeetings } from "@/lib/meetings";
import type { Employee } from "@/lib/types";
import type { Meeting } from "@/types/meeting";
import { MeetingStatusPanel } from "./MeetingStatusPanel";

const RECENT_DAYS = 30;

export function MeetingStatusPanelContainer() {
  const { actor } = useActor();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const managerId = actor?.id || "";

  useEffect(() => {
    if (!managerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      apiFetch<{ items: Employee[] }>("/api/members"),
      getMeetings(managerId),
    ])
      .then(([membersRes, meetingsRes]) => {
        if (cancelled) return;
        setEmployees(membersRes.items ?? []);
        setMeetings(meetingsRes);
      })
      .catch((e) => {
        if (cancelled) return;
        setEmployees([]);
        setMeetings([]);
        setLoadError(e instanceof Error ? e.message : "면담 현황을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [managerId]);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);

  const recentMeetings = meetings.filter((m) => {
    const d = "toDate" in m.meetingDate ? m.meetingDate.toDate() : new Date(m.meetingDate as unknown as string);
    return d >= cutoff;
  });

  const employeeIdsWithRecentMeeting = new Set(
    recentMeetings.map((m) => m.employeeId),
  );
  const noRecentMeetingCount = employees.filter(
    (e) => !employeeIdsWithRecentMeeting.has(e.id),
  ).length;

  if (!managerId || actor?.role === "HR") return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">면담 현황 불러오는 중...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm text-rose-700">{loadError}</p>
      </div>
    );
  }

  return (
    <MeetingStatusPanel
      totalMembers={employees.length}
      recentMeetings={recentMeetings}
      recentMeetingCount={recentMeetings.length}
      noRecentMeetingCount={noRecentMeetingCount}
    />
  );
}
