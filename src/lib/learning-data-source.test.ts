import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapFeedbackLogsToFeedbackRecords,
  mapLogsToOneOnOneRecords,
  mapScoresToLeadershipInput,
} from "@/lib/learning-data-source";

describe("learning data source mappers", () => {
  it("uses direct dimension scores when direction/coaching shape is provided", () => {
    const mapped = mapScoresToLeadershipInput({
      direction: 3,
      coaching: 2,
      decision: 4,
      communication: 3,
      motivation: 4,
      execution: 4,
    });

    assert.equal(mapped.direction, 3);
    assert.equal(mapped.coaching, 2);
    assert.equal(mapped.decision, 4);
    assert.equal(mapped.communication, 3);
    assert.equal(mapped.motivation, 4);
    assert.equal(mapped.execution, 4);
  });

  it("maps leadership scores to assessment input fields", () => {
    const mapped = mapScoresToLeadershipInput({
      q1: 4,
      q2: 2,
      q3: 5,
      q4: 3,
      q5: 2,
      q6: 4,
      q7: 3,
      q8: 1,
      q9: 5,
      q10: 4,
    });

    assert.equal(mapped.direction, 3);
    assert.equal(mapped.execution, 4);
    assert.equal(mapped.coaching, 3);
    assert.equal(mapped.decision, 2);
    assert.equal(mapped.communication, 5);
    assert.equal(mapped.motivation, 4);
  });

  it("maps feedback log types to recommendation feedback types", () => {
    const records = mapFeedbackLogsToFeedbackRecords([
      { id: "1", employeeId: "m1", type: "praise", memo: "good", createdAt: "2026-01-01" },
      { id: "2", employeeId: "m1", type: "improve", memo: "fix", createdAt: "2026-01-02" },
      { id: "3", employeeId: "m1", type: "coaching", memo: "talk", createdAt: "2026-01-03" },
    ]);

    assert.deepEqual(records.map((r) => r.type), ["praise", "improve", "note"]);
  });

  it("maps firestore-style feedback docs (memberId/content) as well", () => {
    const records = mapFeedbackLogsToFeedbackRecords([
      { id: "a1", memberId: "member_1", type: "praise", content: "good", createdAt: "2026-02-01" },
      { id: "a2", memberId: "member_1", type: "note", content: "memo", createdAt: "2026-02-02" },
    ]);

    assert.deepEqual(records, [
      { id: "a1", memberId: "member_1", type: "praise", content: "good", createdAt: "2026-02-01" },
      { id: "a2", memberId: "member_1", type: "note", content: "memo", createdAt: "2026-02-02" },
    ]);
  });

  it("maps logs to one on one records", () => {
    const records = mapLogsToOneOnOneRecords([
      { id: "l1", employeeId: "m1", createdAt: "2026-01-01" },
      { id: "l2", employeeId: "m2", createdAt: "2026-01-02" },
    ]);

    assert.deepEqual(records, [
      { id: "l1", memberId: "m1", createdAt: "2026-01-01" },
      { id: "l2", memberId: "m2", createdAt: "2026-01-02" },
    ]);
  });

  it("maps firestore one on one docs with memberId/notes shape", () => {
    const records = mapLogsToOneOnOneRecords([
      { id: "o1", memberId: "member_1", notes: "n1", createdAt: "2026-03-01" },
      { id: "o2", memberId: "member_2", notes: "n2", createdAt: "2026-03-02" },
    ]);

    assert.deepEqual(records, [
      { id: "o1", memberId: "member_1", createdAt: "2026-03-01" },
      { id: "o2", memberId: "member_2", createdAt: "2026-03-02" },
    ]);
  });
});
