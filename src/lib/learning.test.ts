import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getLearningContentLabel,
  getLearningContentsByCategory,
  learningContents,
  type LearningCategory,
} from "@/lib/learning";

describe("learning contents", () => {
  it("has seeded learning contents", () => {
    assert.equal(learningContents.length > 0, true);
  });

  it("filters by category", () => {
    const category: LearningCategory = "feedback";
    const items = getLearningContentsByCategory(category);

    assert.equal(items.length > 0, true);
    assert.equal(items.every((item) => item.category === category), true);
  });

  it("returns user-friendly label for known content id", () => {
    assert.equal(getLearningContentLabel("sbi-feedback"), "SBI 피드백");
    assert.equal(getLearningContentLabel("oneonone-flow"), "1:1 미팅 구조");
  });

  it("returns raw id when label map does not include id", () => {
    assert.equal(getLearningContentLabel("unknown-id"), "unknown-id");
  });
});
