import test from "node:test";
import assert from "node:assert/strict";
import type { MeetingRecord } from "@/lib/types";
import {
  mergeMeetingLists,
  prependMeeting,
  patchMeetingInList,
  removeMeetingFromList,
} from "@/lib/meetings-store";

function makeMeeting(id: string, note: string): MeetingRecord {
  const now = new Date().toISOString();
  return {
    id,
    managerId: "mgr_120032",
    managerName: "이주현",
    employeeId: "emp_110007",
    employeeName: "채희성",
    meetingType: "coaching",
    meetingDate: now,
    goalSummary: "",
    discussionNotes: note,
    managerComment: "",
    supportNeeded: "",
    actionItems: "",
    nextMeetingDate: null,
    aiSummary: "",
    createdAt: now,
    updatedAt: now,
  };
}

test("prependMeeting keeps existing records and prepends new one", () => {
  const old1 = makeMeeting("m1", "기존1");
  const old2 = makeMeeting("m2", "기존2");
  const next = makeMeeting("m3", "신규");

  const result = prependMeeting([old1, old2], next);

  assert.equal(result.length, 3);
  assert.equal(result[0].id, "m3");
  assert.equal(result[1].id, "m1");
  assert.equal(result[2].id, "m2");
});

test("prependMeeting does not duplicate same id", () => {
  const old1 = makeMeeting("m1", "기존1");
  const sameIdNew = makeMeeting("m1", "신규");

  const result = prependMeeting([old1], sameIdNew);

  assert.equal(result.length, 1);
  assert.equal(result[0].discussionNotes, "기존1");
});

test("patchMeetingInList updates only target item", () => {
  const old1 = makeMeeting("m1", "기존1");
  const old2 = makeMeeting("m2", "기존2");

  const result = patchMeetingInList([old1, old2], "m2", {
    discussionNotes: "수정됨",
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].discussionNotes, "기존1");
  assert.equal(result[1].discussionNotes, "수정됨");
});

test("removeMeetingFromList removes only target id", () => {
  const old1 = makeMeeting("m1", "기존1");
  const old2 = makeMeeting("m2", "기존2");

  const result = removeMeetingFromList([old1, old2], "m1");

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "m2");
});

test("mergeMeetingLists deduplicates by id", () => {
  const a = makeMeeting("m1", "legacy");
  const b = makeMeeting("m2", "legacy2");
  const c = makeMeeting("m1", "firestore");

  const result = mergeMeetingLists([a, b], [c]);

  assert.equal(result.length, 2);
  assert.equal(result.find((m) => m.id === "m1")?.discussionNotes, "firestore");
});

test("mergeMeetingLists keeps all unique meetings", () => {
  const a = makeMeeting("m1", "a");
  const b = makeMeeting("m2", "b");
  const c = makeMeeting("m3", "c");

  const result = mergeMeetingLists([a], [b, c]);

  assert.equal(result.length, 3);
});
