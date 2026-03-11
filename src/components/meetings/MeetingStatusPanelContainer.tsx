"use client";

import { useEffect, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { getMeetings } from "@/lib/meetings";
import { MOCK_TEAM_MEMBERS } from "@/lib/mockTeamMembers";
import type { Employee } from "@/lib/types";
import type { Meeting } from "@/types/meeting";
import { MeetingStatusPanel } from "./MeetingStatusPanel";

const RECENT_DAYS = 30;

export function MeetingStatusPanelContainer() {
  const { actor } = useActor();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const managerId = actor?.id || "";

  useEffect(() => {
    if (!managerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      apiFetch<{ items: Employee[] }>("/api/members").catch(() => ({ items: MOCK_TEAM_MEMBERS })),
      getMeetings(managerId).catch(() => []),
    ])
      .then(([membersRes, meetingsRes]) => {
        if (cancelled) return;
        setEmployees(membersRes.items?.length ? membersRes.items : MOCK_TEAM_MEMBERS);
        setMeetings(Array.isArray(meetingsRes) ? meetingsRes : []);
      })
      .catch(() => {
        if (!cancelled) {
          setEmployees(MOCK_TEAM_MEMBERS);
          setMeetings([]);
        }
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

  return (
    <MeetingStatusPanel
      totalMembers={employees.length}
      recentMeetings={recentMeetings}
      recentMeetingCount={recentMeetings.length}
      noRecentMeetingCount={noRecentMeetingCount}
    />
  );
}
