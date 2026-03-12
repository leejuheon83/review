import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlantStage,
  getStageLabel,
  getStageMessage,
  getNextStageTarget,
  getRemainingToNextStage,
} from "@/lib/growth";

test("getPlantStage returns correct stage for feedback count", () => {
  assert.equal(getPlantStage(0), 0);
  assert.equal(getPlantStage(1), 1);
  assert.equal(getPlantStage(2), 1);
  assert.equal(getPlantStage(3), 2);
  assert.equal(getPlantStage(5), 2);
  assert.equal(getPlantStage(6), 3);
  assert.equal(getPlantStage(9), 3);
  assert.equal(getPlantStage(10), 4);
  assert.equal(getPlantStage(100), 4);
});

test("getStageLabel returns Korean labels", () => {
  assert.equal(getStageLabel(0), "씨앗 단계");
  assert.equal(getStageLabel(1), "새싹 단계");
  assert.equal(getStageLabel(2), "성장 단계");
  assert.equal(getStageLabel(3), "안정 단계");
  assert.equal(getStageLabel(4), "개화 단계");
});

test("getStageMessage returns appropriate messages", () => {
  assert.equal(getStageMessage(0), "성장을 시작해보세요");
  assert.equal(getStageMessage(1), "첫 대화가 시작됐어요");
  assert.equal(getStageMessage(3), "꾸준히 자라고 있어요");
  assert.equal(getStageMessage(10), "깊이 있는 피드백이 쌓였어요");
});

test("getNextStageTarget returns correct targets", () => {
  assert.equal(getNextStageTarget(0), 1);
  assert.equal(getNextStageTarget(1), 3);
  assert.equal(getNextStageTarget(2), 6);
  assert.equal(getNextStageTarget(3), 10);
  assert.equal(getNextStageTarget(4), null);
});

test("getRemainingToNextStage returns correct remaining count", () => {
  assert.equal(getRemainingToNextStage(0), 1);
  assert.equal(getRemainingToNextStage(1), 2);
  assert.equal(getRemainingToNextStage(2), 1);
  assert.equal(getRemainingToNextStage(3), 3);
  assert.equal(getRemainingToNextStage(9), 1);
  assert.equal(getRemainingToNextStage(10), null);
});
