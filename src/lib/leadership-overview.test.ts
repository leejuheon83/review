import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildLeadershipOverview } from "@/lib/leadership-overview";

describe("buildLeadershipOverview", () => {
  it("builds overview from q1~q10 score shape", () => {
    const overview = buildLeadershipOverview({
      totalScore: 30,
      scores: {
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
      },
    });

    assert.equal(overview?.totalScore, 30);
    assert.equal(overview?.resultLabel, "안정적 리더십");
    assert.equal(overview?.categoryAverages.length, 5);
    assert.equal(overview?.categoryAverages[0]?.average, 3);
  });

  it("returns null when assessment is missing", () => {
    const overview = buildLeadershipOverview(null);
    assert.equal(overview, null);
  });
});
