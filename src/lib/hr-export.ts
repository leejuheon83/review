import type { DBState } from "@/lib/types";

export type ExportFilters = {
  teamId: string;
  managerId: string;
  employeeId: string;
  from?: string | null;
  to?: string | null;
};

export type MeetingExportRow = {
  id: string;
  meetingDate: string;
  manager: string;
  employee: string;
  type: string;
  goalSummary: string;
  discussionNotes: string;
  managerComment: string;
  supportNeeded: string;
  actionItems: string;
  nextMeetingDate: string;
  aiSummary: string;
  createdAt: string;
};

export function buildMeetingExportRows(state: DBState, filters: ExportFilters): MeetingExportRow[] {
  const { teamId, managerId, employeeId, from, to } = filters;
  const fromTs = from ? new Date(from).getTime() : null;
  const toTs = to ? new Date(to).getTime() : null;

  return state.meetings
    .filter((meeting) => {
      const employee = state.employees.find((e) => e.id === meeting.employeeId);
      const manager = state.users.find((u) => u.id === meeting.managerId);
      if (!employee || !manager) return false;
      if (teamId !== "all" && employee.teamId !== teamId) return false;
      if (managerId !== "all" && manager.id !== managerId) return false;
      if (employeeId !== "all" && employee.id !== employeeId) return false;

      const ts = new Date(meeting.meetingDate || meeting.createdAt).getTime();
      if (Number.isNaN(ts)) return false;
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    })
    .sort((a, b) => {
      const employeeA = state.employees.find((e) => e.id === a.employeeId)?.name ?? "";
      const employeeB = state.employees.find((e) => e.id === b.employeeId)?.name ?? "";
      const byEmployee = employeeA.localeCompare(employeeB, "ko");
      if (byEmployee !== 0) return byEmployee;

      const ta = new Date(a.meetingDate || a.createdAt).getTime();
      const tb = new Date(b.meetingDate || b.createdAt).getTime();
      return tb - ta;
    })
    .map((meeting) => {
      const employee = state.employees.find((e) => e.id === meeting.employeeId)?.name || "";
      const manager = state.users.find((u) => u.id === meeting.managerId)?.name || "";
      return {
        id: meeting.id,
        meetingDate: meeting.meetingDate,
        manager,
        employee,
        type: meeting.meetingType,
        goalSummary: meeting.goalSummary,
        discussionNotes: meeting.discussionNotes,
        managerComment: meeting.managerComment,
        supportNeeded: meeting.supportNeeded,
        actionItems: meeting.actionItems,
        nextMeetingDate: meeting.nextMeetingDate || "",
        aiSummary: meeting.aiSummary,
        createdAt: meeting.createdAt,
      };
    });
}
