import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
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
});
