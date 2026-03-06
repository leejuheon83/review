import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createLeadershipAssessmentRepository,
  type LeadershipAssessmentDoc,
} from "@/lib/leadership-assessment.repository";
import type { LeadershipScores } from "@/lib/leadership-assessment";

describe("leadership assessment repository", () => {
  it("saveLeadershipAssessment adds createdAt and writes document", async () => {
    const calls: { payload?: unknown; collectionName?: string } = {};
    const deps = {
      collection: (_db: unknown, name: string) => {
        calls.collectionName = name;
        return { name };
      },
      addDoc: async (_ref: unknown, payload: unknown) => {
        calls.payload = payload;
        return { id: "doc-1" };
      },
      serverTimestamp: () => "MOCK_TS",
      query: (...parts: unknown[]) => ({ parts }),
      where: (...args: unknown[]) => ({ where: args }),
      orderBy: (...args: unknown[]) => ({ orderBy: args }),
      limit: (count: number) => ({ limit: count }),
      getDocs: async () => ({ docs: [] }),
    };

    const repository = createLeadershipAssessmentRepository({
      db: {},
      deps,
    });

    const scores: LeadershipScores = {
      q1: 3,
      q2: 3,
      q3: 3,
      q4: 3,
      q5: 3,
      q6: 3,
      q7: 3,
      q8: 3,
      q9: 3,
      q10: 3,
    };
    const input: LeadershipAssessmentDoc = {
      ownerUid: "manager-1",
      monthKey: "2026-03",
      scores,
      totalScore: 30,
      memo: "테스트 메모",
    };

    const result = await repository.saveLeadershipAssessment(input);

    assert.equal(calls.collectionName, "leadershipAssessments");
    assert.deepEqual(calls.payload, {
      ...input,
      createdAt: "MOCK_TS",
    });
    assert.equal(result.id, "doc-1");
  });

  it("getRecentLeadershipAssessments maps firestore docs", async () => {
    let queryParts: unknown[] = [];
    const deps = {
      collection: (_db: unknown, name: string) => ({ name }),
      addDoc: async () => ({ id: "unused" }),
      serverTimestamp: () => "MOCK_TS",
      query: (...parts: unknown[]) => {
        queryParts = parts;
        return { parts };
      },
      where: (...args: unknown[]) => ({ where: args }),
      orderBy: (...args: unknown[]) => ({ orderBy: args }),
      limit: (count: number) => ({ limit: count }),
      getDocs: async () => ({
        docs: [
          {
            id: "a1",
            data: () => ({ ownerUid: "manager-1", totalScore: 31 }),
          },
          {
            id: "a2",
            data: () => ({ ownerUid: "manager-1", totalScore: 29 }),
          },
        ],
      }),
    };

    const repository = createLeadershipAssessmentRepository({
      db: {},
      deps,
    });

    const rows = await repository.getRecentLeadershipAssessments("manager-1");

    assert.equal(queryParts.length, 4);
    assert.deepEqual(rows, [
      { id: "a1", ownerUid: "manager-1", totalScore: 31 },
      { id: "a2", ownerUid: "manager-1", totalScore: 29 },
    ]);
  });
});
