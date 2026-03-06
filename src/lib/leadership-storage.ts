import type { LeadershipScores } from "@/lib/leadership-assessment";

export type LeadershipAssessmentPayload = {
  ownerUid: string;
  monthKey: string;
  scores: LeadershipScores;
  totalScore: number;
  memo: string;
};

export type LeadershipAssessmentItem = LeadershipAssessmentPayload & {
  id: string;
};

type LeadershipStorageDeps = {
  saveToFirestore: (input: LeadershipAssessmentPayload) => Promise<unknown>;
  saveToApi: (input: LeadershipAssessmentPayload) => Promise<unknown>;
  getRecentFromFirestore: (ownerUid: string) => Promise<LeadershipAssessmentItem[]>;
  getRecentFromApi: (ownerUid: string) => Promise<LeadershipAssessmentItem[]>;
};

export function createLeadershipStorageService(deps: LeadershipStorageDeps) {
  return {
    async saveLeadershipAssessment(input: LeadershipAssessmentPayload) {
      try {
        return await deps.saveToFirestore(input);
      } catch {
        return deps.saveToApi(input);
      }
    },
    async getRecentLeadershipAssessments(ownerUid: string) {
      try {
        return await deps.getRecentFromFirestore(ownerUid);
      } catch {
        return deps.getRecentFromApi(ownerUid);
      }
    },
  };
}
