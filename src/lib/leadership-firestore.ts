"use client";

import { apiFetch } from "@/lib/client-api";
import {
  getRecentLeadershipAssessments as getRecentFromFirestoreRepo,
  saveLeadershipAssessment as saveToFirestoreRepo,
  type LeadershipAssessmentDoc,
} from "@/lib/leadership-assessment.repository";
import type { LeadershipAssessmentItem, LeadershipAssessmentPayload } from "@/lib/leadership-storage";

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer));
  });
}

export type { LeadershipAssessmentPayload as LeadershipAssessmentDoc };

async function saveViaApi(input: LeadershipAssessmentPayload) {
  return apiFetch<{ item: LeadershipAssessmentItem }>("/api/leadership-assessments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function getRecentViaApi(ownerUid: string) {
  const res = await apiFetch<{ items: LeadershipAssessmentItem[] }>(
    `/api/leadership-assessments?ownerUid=${encodeURIComponent(ownerUid)}`,
  );
  return res.items;
}

export async function saveLeadershipAssessment(input: LeadershipAssessmentPayload) {
  try {
    // App login(actor) 기반 권한체크를 타는 API를 우선 사용해 저장 안정성을 확보한다.
    return await saveViaApi(input);
  } catch (apiError) {
    try {
      await withTimeout(saveToFirestoreRepo(input as LeadershipAssessmentDoc));
      return;
    } catch {
      throw apiError;
    }
  }
}

export async function getRecentLeadershipAssessments(ownerUid: string) {
  try {
    return await getRecentViaApi(ownerUid);
  } catch (apiError) {
    try {
      return (await withTimeout(getRecentFromFirestoreRepo(ownerUid))) as LeadershipAssessmentItem[];
    } catch {
      throw apiError;
    }
  }
}
