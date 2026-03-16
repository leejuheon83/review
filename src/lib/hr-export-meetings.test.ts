import test from "node:test";
import assert from "node:assert/strict";
import { buildMeetingExportRows } from "@/lib/hr-export";
import type { DBState, MeetingRecord } from "@/lib/types";

function makeMeeting(
  id: string,
  employeeId: string,
  managerId: string,
  meetingDate: string,
): MeetingRecord {
  return {
    id,
    managerId,
    managerName: "",
    employeeId,
    employeeName: "",
    meetingType: "coaching",
    meetingDate,
    goalSummary: "",
    discussionNotes: id,
    managerComment: "",
    supportNeeded: "",
    actionItems: "",
    nextMeetingDate: null,
    aiSummary: "",
    createdAt: meetingDate,
    updatedAt: meetingDate,
  };
}

const baseState: DBState = {
  users: [
    { id: "admin", name: "관리자", role: "HR" },
    { id: "mgr_a", name: "팀장A", role: "MANAGER", teamId: "t1" },
    { id: "mgr_b", name: "팀장B", role: "MANAGER", teamId: "t2" },
  ],
  teams: [
    { id: "t1", name: "1팀" },
    { id: "t2", name: "2팀" },
  ],
  employees: [
    { id: "e1", name: "가나", role: "", teamId: "t1", managerId: "mgr_a", active: true },
    { id: "e2", name: "다라", role: "", teamId: "t2", managerId: "mgr_b", active: true },
  ],
  logs: [],
  notes: [],
  summaries: [],
  leadershipAssessments: [],
  meetings: [],
};

test("개인별(팀원명) 정렬 후 날짜 내림차순으로 반환한다", () => {
  const state: DBState = {
    ...baseState,
    meetings: [
      makeMeeting("m1", "e2", "mgr_b", "2026-03-01T00:00:00.000Z"),
      makeMeeting("m2", "e1", "mgr_a", "2026-03-03T00:00:00.000Z"),
      makeMeeting("m3", "e1", "mgr_a", "2026-03-02T00:00:00.000Z"),
    ],
  };

  const rows = buildMeetingExportRows(state, {
    teamId: "all",
    managerId: "all",
    employeeId: "all",
  });

  assert.equal(rows.length, 3);
  assert.equal(rows[0].employee, "가나");
  assert.equal(rows[0].meetingDate, "2026-03-03T00:00:00.000Z");
  assert.equal(rows[1].employee, "가나");
  assert.equal(rows[1].meetingDate, "2026-03-02T00:00:00.000Z");
  assert.equal(rows[2].employee, "다라");
});

test("teamId/managerId/from/to 필터를 적용한다", () => {
  const state: DBState = {
    ...baseState,
    meetings: [
      makeMeeting("m1", "e1", "mgr_a", "2026-03-01T00:00:00.000Z"),
      makeMeeting("m2", "e2", "mgr_b", "2026-03-05T00:00:00.000Z"),
    ],
  };

  const byTeam = buildMeetingExportRows(state, {
    teamId: "t1",
    managerId: "all",
    employeeId: "all",
  });
  assert.equal(byTeam.length, 1);
  assert.equal(byTeam[0].employee, "가나");

  const byManager = buildMeetingExportRows(state, {
    teamId: "all",
    managerId: "mgr_b",
    employeeId: "all",
  });
  assert.equal(byManager.length, 1);
  assert.equal(byManager[0].manager, "팀장B");

  const byDate = buildMeetingExportRows(state, {
    teamId: "all",
    managerId: "all",
    employeeId: "all",
    from: "2026-03-02T00:00:00.000Z",
    to: "2026-03-10T00:00:00.000Z",
  });
  assert.equal(byDate.length, 1);
  assert.equal(byDate[0].id, "m2");
});
