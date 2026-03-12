"use client";

import { apiFetch } from "@/lib/client-api";
import type { Meeting, MeetingFormData, MeetingInput, MeetingType } from "@/types/meeting";

type MeetingApiDoc = {
  id: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  meetingType: MeetingType;
  meetingDate: string;
  goalSummary: string;
  discussionNotes: string;
  managerComment: string;
  supportNeeded: string;
  actionItems: string;
  nextMeetingDate: string | null;
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
};

function toMeeting(d: MeetingApiDoc): Meeting {
  return {
    ...d,
    meetingDate: { toDate: () => new Date(d.meetingDate) } as Meeting["meetingDate"],
    nextMeetingDate: d.nextMeetingDate
      ? ({ toDate: () => new Date(d.nextMeetingDate!) } as Meeting["nextMeetingDate"])
      : null,
    createdAt: { toDate: () => new Date(d.createdAt) } as Meeting["createdAt"],
    updatedAt: { toDate: () => new Date(d.updatedAt) } as Meeting["updatedAt"],
  };
}

export async function createMeeting(input: MeetingFormData | MeetingInput): Promise<string> {
  const meetingDate = input.meetingDate instanceof Date ? input.meetingDate : (input.meetingDate as { toDate: () => Date }).toDate();
  const nextMeetingDate = input.nextMeetingDate
    ? (input.nextMeetingDate instanceof Date ? input.nextMeetingDate : (input.nextMeetingDate as { toDate: () => Date }).toDate())
    : null;
  const res = await apiFetch<{ id: string }>("/api/meetings", {
    method: "POST",
    body: JSON.stringify({
      managerId: input.managerId,
      managerName: input.managerName,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      meetingType: input.meetingType,
      meetingDate: meetingDate.toISOString(),
      goalSummary: input.goalSummary || "",
      discussionNotes: input.discussionNotes || "",
      managerComment: input.managerComment || "",
      supportNeeded: input.supportNeeded || "",
      actionItems: input.actionItems || "",
      nextMeetingDate: nextMeetingDate ? nextMeetingDate.toISOString() : null,
      aiSummary: input.aiSummary || "",
    }),
  });
  return res.id;
}

export async function getMeetings(managerId: string, typeFilter?: MeetingType): Promise<Meeting[]> {
  const params = new URLSearchParams({ managerId });
  if (typeFilter) params.set("type", typeFilter);
  const res = await apiFetch<{ items: MeetingApiDoc[] }>(`/api/meetings?${params}`);
  return res.items.map(toMeeting);
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const res = await apiFetch<{ item: MeetingApiDoc | null }>(`/api/meetings/${id}`);
  return res.item ? toMeeting(res.item) : null;
}

export async function updateMeeting(id: string, input: Partial<MeetingFormData | MeetingInput>): Promise<void> {
  const payload: Record<string, unknown> = { ...input };
  if (input.meetingDate) {
    payload.meetingDate =
      input.meetingDate instanceof Date
        ? input.meetingDate.toISOString()
        : (input.meetingDate as { toDate: () => Date }).toDate().toISOString();
  }
  if (input.nextMeetingDate !== undefined) {
    payload.nextMeetingDate = input.nextMeetingDate
      ? (input.nextMeetingDate instanceof Date
          ? input.nextMeetingDate
          : (input.nextMeetingDate as { toDate: () => Date }).toDate()
        ).toISOString()
      : null;
  }
  await apiFetch<{ ok: boolean }>(`/api/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMeeting(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/meetings/${id}`, { method: "DELETE" });
}

export function formatMeetingDate(ts: Meeting["meetingDate"] | Date | string): string {
  if (typeof ts === "string") return new Date(ts).toLocaleDateString("ko-KR");
  const d = ts instanceof Date ? ts : (ts as { toDate: () => Date }).toDate();
  return d.toLocaleDateString("ko-KR");
}

/** Firestore Timestamp 또는 Date를 Date로 변환 */
export function toDate(
  ts: Meeting["meetingDate"] | Meeting["nextMeetingDate"] | Date | null | undefined,
): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "object" && "toDate" in ts) return (ts as { toDate: () => Date }).toDate();
  return new Date(ts as string);
}
