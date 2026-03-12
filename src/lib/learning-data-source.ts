"use client";

import { apiFetch } from "@/lib/client-api";
import type { FeedbackType } from "@/lib/types";
import type {
  FeedbackRecord,
  LeadershipAssessmentInput,
  OneOnOneRecord,
} from "@/lib/learning-recommendation";

type LeadershipAssessmentApiItem = {
  id: string;
  ownerUid: string;
  scores?: Record<string, number>;
  createdAt?: string;
};

type FeedbackLogApiItem = {
  id: string;
  employeeId?: string;
  memberId?: string;
  type: FeedbackType | "note";
  memo?: string;
  content?: string;
  createdAt: string;
};

export function mapScoresToLeadershipInput(
  scores?: Record<string, number>,
): LeadershipAssessmentInput {
  if (!scores) return {};
  const hasDirectShape =
    "direction" in scores ||
    "coaching" in scores ||
    "decision" in scores ||
    "communication" in scores ||
    "motivation" in scores ||
    "execution" in scores;
  if (hasDirectShape) {
    return {
      direction: scores.direction ?? 3,
      coaching: scores.coaching ?? 3,
      decision: scores.decision ?? 3,
      communication: scores.communication ?? 3,
      motivation: scores.motivation ?? 3,
      execution: scores.execution ?? 3,
    };
  }
  const avg = (a: number, b: number) => Math.round(((a + b) / 2) * 10) / 10;
  return {
    direction: avg(scores.q1 ?? 3, scores.q2 ?? 3),
    execution: avg(scores.q3 ?? 3, scores.q4 ?? 3),
    coaching: avg(scores.q5 ?? 3, scores.q6 ?? 3),
    decision: avg(scores.q7 ?? 3, scores.q8 ?? 3),
    communication: scores.q9 ?? 3,
    motivation: scores.q10 ?? 3,
  };
}

export function mapFeedbackLogsToFeedbackRecords(logs: FeedbackLogApiItem[]): FeedbackRecord[] {
  return logs.map((log) => ({
    id: log.id,
    memberId: log.memberId || log.employeeId || "",
    type: log.type === "praise" ? "praise" : log.type === "improve" ? "improve" : "note",
    content: log.content || log.memo || "",
    createdAt: log.createdAt,
  }));
}

export function mapLogsToOneOnOneRecords(
  logs: Array<{
    id: string;
    employeeId?: string;
    memberId?: string;
    notes?: string;
    createdAt: string;
  }>,
): OneOnOneRecord[] {
  return logs.map((log) => ({
    id: log.id,
    memberId: log.memberId || log.employeeId || "",
    createdAt: log.createdAt,
  }));
}

export async function getLatestLeadershipAssessment(
  ownerUid: string,
): Promise<LeadershipAssessmentInput | null> {
  const res = await apiFetch<{ items: LeadershipAssessmentApiItem[] }>(
    `/api/leadership-assessments?ownerUid=${encodeURIComponent(ownerUid)}`,
  );
  const latest = res.items[0];
  if (!latest) return null;
  return mapScoresToLeadershipInput(latest.scores);
}

export async function getRecentFeedbacks(ownerUid: string): Promise<FeedbackRecord[]> {
  const _ownerUid = ownerUid;
  void _ownerUid;
  const res = await apiFetch<{ items: FeedbackLogApiItem[] }>(
    "/api/logs?period=90&type=all&sort=latest",
  );
  return mapFeedbackLogsToFeedbackRecords(res.items.slice(0, 50));
}

type MeetingApiItem = {
  id: string;
  employeeId: string;
  meetingDate: string;
  createdAt?: string;
};

export async function getRecentOneOnOnes(ownerUid: string): Promise<OneOnOneRecord[]> {
  const [logsRes, meetingsRes] = await Promise.all([
    apiFetch<{ items: FeedbackLogApiItem[] }>("/api/logs?period=90&type=coaching&sort=latest"),
    apiFetch<{ items: MeetingApiItem[] }>(`/api/meetings?managerId=${encodeURIComponent(ownerUid)}`),
  ]);
  const fromLogs = mapLogsToOneOnOneRecords(logsRes.items);
  const fromMeetings = (meetingsRes.items ?? []).map((m) => ({
    id: m.id,
    memberId: m.employeeId,
    createdAt: m.meetingDate ?? m.createdAt ?? "",
  }));
  const merged = [...fromLogs, ...fromMeetings].sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    return tb - ta;
  });
  return merged.slice(0, 50);
}
