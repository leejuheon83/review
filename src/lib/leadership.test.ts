import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  defaultLeadershipScores,
  getCategoryAverages,
  getMonthKey,
  getResultLabel,
  getScoreMeaning,
  getStrengthAndFocus,
  getTotalScore,
  type LeadershipScores,
} from "@/lib/leadership";

describe("leadership domain", () => {
  it("calculates total score", () => {
    const total = getTotalScore(defaultLeadershipScores);
    assert.equal(total, 30);
  });

  it("returns result label by score range", () => {
    assert.equal(getResultLabel(42), "강력한 리더십");
    assert.equal(getResultLabel(33), "안정적 리더십");
    assert.equal(getResultLabel(24), "개선 필요");
    assert.equal(getResultLabel(10), "리더십 재정비 필요");
  });

  it("returns score meaning", () => {
    assert.equal(getScoreMeaning(1), "전혀 아니다");
    assert.equal(getScoreMeaning(3), "보통이다");
    assert.equal(getScoreMeaning(5), "항상 그렇다");
    assert.equal(getScoreMeaning(0), "");
  });

  it("calculates category averages", () => {
    const scores: LeadershipScores = {
      q1: 5,
      q2: 5,
      q3: 4,
      q4: 4,
      q5: 3,
      q6: 3,
      q7: 2,
      q8: 2,
      q9: 1,
      q10: 1,
    };

    const averages = getCategoryAverages(scores);
    const map = Object.fromEntries(averages.map((item) => [item.category, item.average]));

    assert.equal(map["방향 제시"], 5);
    assert.equal(map["모범"], 4);
    assert.equal(map["코칭/성장"], 3);
    assert.equal(map["의사결정/실행"], 2);
    assert.equal(map["신뢰/동기부여"], 1);
  });

  it("returns strength and focus categories", () => {
    const scores: LeadershipScores = {
      q1: 4,
      q2: 4,
      q3: 5,
      q4: 5,
      q5: 3,
      q6: 3,
      q7: 2,
      q8: 2,
      q9: 1,
      q10: 1,
    };

    const result = getStrengthAndFocus(scores);
    assert.equal(result.strength.category, "모범");
    assert.equal(result.focus.category, "신뢰/동기부여");
  });

  it("returns yyyy-mm month key", () => {
    const date = new Date("2026-03-06T00:00:00.000Z");
    assert.equal(getMonthKey(date), "2026-03");
  });
});
