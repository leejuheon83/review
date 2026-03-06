import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createLeadershipStorageService,
  type LeadershipAssessmentPayload,
} from "@/lib/leadership-storage";

describe("leadership storage fallback", () => {
  it("uses firestore first when it succeeds", async () => {
    const calls = { firestore: 0, api: 0 };
    const service = createLeadershipStorageService({
      saveToFirestore: async () => {
        calls.firestore += 1;
      },
      saveToApi: async () => {
        calls.api += 1;
      },
      getRecentFromFirestore: async () => [],
      getRecentFromApi: async () => [],
    });

    const payload: LeadershipAssessmentPayload = {
      ownerUid: "mgr_120032",
      monthKey: "2026-03",
      scores: { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
      totalScore: 30,
      memo: "ok",
    };
    await service.saveLeadershipAssessment(payload);
    assert.equal(calls.firestore, 1);
    assert.equal(calls.api, 0);
  });

  it("falls back to api when firestore save fails", async () => {
    const calls = { api: 0 };
    const service = createLeadershipStorageService({
      saveToFirestore: async () => {
        throw new Error("permission-denied");
      },
      saveToApi: async () => {
        calls.api += 1;
      },
      getRecentFromFirestore: async () => [],
      getRecentFromApi: async () => [],
    });

    const payload: LeadershipAssessmentPayload = {
      ownerUid: "mgr_120032",
      monthKey: "2026-03",
      scores: { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 },
      totalScore: 30,
      memo: "ok",
    };
    await service.saveLeadershipAssessment(payload);
    assert.equal(calls.api, 1);
  });

  it("falls back to api when firestore recent query fails", async () => {
    const service = createLeadershipStorageService({
      saveToFirestore: async () => undefined,
      saveToApi: async () => undefined,
      getRecentFromFirestore: async () => {
        throw new Error("unauthenticated");
      },
      getRecentFromApi: async () => [{ id: "1", ownerUid: "mgr_120032", monthKey: "2026-03", totalScore: 28, memo: "" }],
    });

    const items = await service.getRecentLeadershipAssessments("mgr_120032");
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "1");
  });
});
