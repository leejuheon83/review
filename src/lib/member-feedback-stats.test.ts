import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMemberFeedbackStatMap } from "@/lib/member-feedback-stats";
import type { FeedbackLog } from "@/lib/types";

describe("buildMemberFeedbackStatMap", () => {
  it("aggregates latest date and feedback type counts by member", () => {
    const logs: FeedbackLog[] = [
      {
        id: "l1",
        employeeId: "emp_1",
        managerId: "mgr_1",
        type: "praise",
        memo: "칭찬",
        tags: [],
        pinned: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "l2",
        employeeId: "emp_1",
        managerId: "mgr_1",
        type: "growth",
        memo: "성장",
        tags: [],
        pinned: false,
        createdAt: "2026-03-02T00:00:00.000Z",
        updatedAt: "2026-03-02T00:00:00.000Z",
      },
      {
        id: "l3",
        employeeId: "emp_1",
        managerId: "mgr_1",
        type: "coaching",
        memo: "코칭",
        tags: [],
        pinned: false,
        createdAt: "2026-03-03T00:00:00.000Z",
        updatedAt: "2026-03-03T00:00:00.000Z",
      },
      {
        id: "l4",
        employeeId: "emp_2",
        managerId: "mgr_1",
        type: "improve",
        memo: "개선",
        tags: [],
        pinned: false,
        createdAt: "2026-03-04T00:00:00.000Z",
        updatedAt: "2026-03-04T00:00:00.000Z",
      },
    ];

    const statMap = buildMemberFeedbackStatMap(logs);
    const emp1 = statMap.get("emp_1");
    const emp2 = statMap.get("emp_2");

    assert.equal(emp1?.lastDate, "2026-03-03T00:00:00.000Z");
    assert.equal(emp1?.praiseCount, 1);
    assert.equal(emp1?.growthCount, 1);
    assert.equal(emp1?.improveCount, 0);
    assert.equal(emp1?.coachingCount, 1);

    assert.equal(emp2?.lastDate, "2026-03-04T00:00:00.000Z");
    assert.equal(emp2?.improveCount, 1);
  });

  it("ignores unsupported type in per-column counts", () => {
    const logs: FeedbackLog[] = [
      {
        id: "l5",
        employeeId: "emp_1",
        managerId: "mgr_1",
        type: "other",
        memo: "기타",
        tags: [],
        pinned: false,
        createdAt: "2026-03-05T00:00:00.000Z",
        updatedAt: "2026-03-05T00:00:00.000Z",
      },
    ];
    const statMap = buildMemberFeedbackStatMap(logs);
    const emp1 = statMap.get("emp_1");

    assert.equal(emp1?.praiseCount, 0);
    assert.equal(emp1?.growthCount, 0);
    assert.equal(emp1?.improveCount, 0);
    assert.equal(emp1?.coachingCount, 0);
  });
});
