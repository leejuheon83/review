import type { Timestamp } from "firebase/firestore";

export type MeetingType = "goal" | "quarterly" | "coaching" | "general";

export type Meeting = {
  id: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  meetingType: MeetingType;
  meetingDate: Timestamp;
  goalSummary: string;
  discussionNotes: string;
  managerComment: string;
  supportNeeded: string;
  actionItems: string;
  nextMeetingDate: Timestamp | null;
  aiSummary: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MeetingFormData = {
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  meetingType: MeetingType;
  meetingDate: Date;
  goalSummary: string;
  discussionNotes: string;
  managerComment: string;
  supportNeeded: string;
  actionItems: string;
  nextMeetingDate: Date | null;
  aiSummary: string;
};

export type MeetingInput = Omit<
  Meeting,
  "id" | "createdAt" | "updatedAt"
> & {
  meetingDate: Date | Timestamp;
  nextMeetingDate: Date | Timestamp | null;
};

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  goal: "연초 목표 면담",
  quarterly: "분기 점검",
  coaching: "수시 코칭",
  general: "기타",
};

export const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: "goal", label: "연초 목표 면담" },
  { value: "quarterly", label: "분기 점검" },
  { value: "coaching", label: "수시 코칭" },
  { value: "general", label: "기타" },
];
