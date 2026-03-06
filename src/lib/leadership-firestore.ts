"use client";

import { apiFetch } from "@/lib/client-api";
import {
  getRecentLeadershipAssessments as getRecentFromFirestoreRepo,
  saveLeadershipAssessment as saveToFirestoreRepo,
  type LeadershipAssessmentDoc,
} from "@/lib/leadership-assessment.repository";
import {
  createLeadershipStorageService,
  type LeadershipAssessmentItem,
  type LeadershipAssessmentPayload,
} from "@/lib/leadership-storage";

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer));
  });
}

const service = createLeadershipStorageService({
  saveToFirestore: async (input) => {
    await withTimeout(saveToFirestoreRepo(input as LeadershipAssessmentDoc));
  },
  saveToApi: (input) =>
    apiFetch<{ item: LeadershipAssessmentItem }>("/api/leadership-assessments", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getRecentFromFirestore: async (ownerUid) =>
    (await withTimeout(getRecentFromFirestoreRepo(ownerUid))) as LeadershipAssessmentItem[],
  getRecentFromApi: async (ownerUid) => {
    const res = await apiFetch<{ items: LeadershipAssessmentItem[] }>(
      `/api/leadership-assessments?ownerUid=${encodeURIComponent(ownerUid)}`,
    );
    return res.items;
  },
});

export type { LeadershipAssessmentPayload as LeadershipAssessmentDoc };

export function saveLeadershipAssessment(input: LeadershipAssessmentPayload) {
  return service.saveLeadershipAssessment(input);
}

export function getRecentLeadershipAssessments(ownerUid: string) {
  return service.getRecentLeadershipAssessments(ownerUid);
}
