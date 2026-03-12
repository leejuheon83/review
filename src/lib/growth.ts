export type PlantStage = 0 | 1 | 2 | 3 | 4;

const STAGE_LABELS: Record<PlantStage, string> = {
  0: "씨앗 단계",
  1: "새싹 단계",
  2: "성장 단계",
  3: "안정 단계",
  4: "개화 단계",
};

const STAGE_MESSAGES: Record<PlantStage, string> = {
  0: "성장을 시작해보세요",
  1: "첫 대화가 시작됐어요",
  2: "꾸준히 자라고 있어요",
  3: "안정적으로 성장 중이에요",
  4: "깊이 있는 피드백이 쌓였어요",
};

const STAGE_TARGETS: Record<PlantStage, number | null> = {
  0: 1,
  1: 3,
  2: 6,
  3: 10,
  4: null,
};

export function getPlantStage(feedbackCount: number): PlantStage {
  if (feedbackCount <= 0) return 0;
  if (feedbackCount <= 2) return 1;
  if (feedbackCount <= 5) return 2;
  if (feedbackCount <= 9) return 3;
  return 4;
}

export function getStageLabel(stage: PlantStage): string {
  return STAGE_LABELS[stage];
}

export function getStageMessage(feedbackCount: number): string {
  const stage = getPlantStage(feedbackCount);
  return STAGE_MESSAGES[stage];
}

export function getNextStageTarget(stage: PlantStage): number | null {
  return STAGE_TARGETS[stage];
}

export function getRemainingToNextStage(feedbackCount: number): number | null {
  const stage = getPlantStage(feedbackCount);
  const target = getNextStageTarget(stage);
  if (target === null) return null;
  return Math.max(0, target - feedbackCount);
}
