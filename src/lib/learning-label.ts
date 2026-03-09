import { getLearningContentLabel as getLabelFromLearning } from "@/lib/learning";

export function getLearningContentLabel(id: string) {
  return getLabelFromLearning(id);
}
