import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLearningRecommendation,
  getRecommendedContents,
} from "@/lib/learning-recommendation";

describe("buildLearningRecommendation", () => {
  it("returns feedback focus when coaching score is low", () => {
    const result = buildLearningRecommendation({
      leadership: {
        coaching: 2,
      },
    });

    assert.equal(result.focusArea, "feedback");
    assert.equal(result.recommendedContentIds.includes("sbi-feedback"), true);
    assert.equal(result.actionGuideTitle.length > 0, true);
    assert.equal(result.actionGuideSummary.length > 0, true);
    assert.equal(result.actionItems.length > 0, true);
    assert.ok(Array.isArray(result.basis));
    assert.ok(result.basis.length > 0);
  });

  it("returns oneonone focus when one on one logs are not enough", () => {
    const result = buildLearningRecommendation({
      leadership: {
        coaching: 4,
      },
      feedbacks: [{ id: "f1", memberId: "m1", type: "praise", content: "good" }],
      oneOnOnes: [],
    });

    assert.equal(result.focusArea, "oneonone");
    assert.deepEqual(result.recommendedContentIds, ["oneonone-flow", "oneonone-questions"]);
    assert.equal(result.actionItems.length, 3);
    assert.ok(Array.isArray(result.basis));
  });
});

describe("getRecommendedContents", () => {
  it("returns only existing content ids", () => {
    const items = getRecommendedContents(["sbi-feedback", "unknown-id"]);

    assert.equal(items.length, 1);
    assert.equal(items[0].id, "sbi-feedback");
  });
});
