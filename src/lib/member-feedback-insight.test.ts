import test from "node:test";
import assert from "node:assert/strict";
import type { FeedbackLog } from "@/lib/types";
import { buildMemberFeedbackInsight } from "@/lib/member-feedback-insight";

function makeLog(partial: Partial<FeedbackLog>): FeedbackLog {
  return {
    id: partial.id || "log_1",
    employeeId: partial.employeeId || "emp_1",
    managerId: partial.managerId || "mgr_1",
    type: partial.type || "coaching",
    memo: partial.memo || "테스트 메모",
    tags: partial.tags || [],
    pinned: partial.pinned || false,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
  };
}

test("누적 요약은 유형별 개수와 총합을 계산한다", () => {
  const logs: FeedbackLog[] = [
    makeLog({ type: "praise" }),
    makeLog({ id: "2", type: "coaching" }),
    makeLog({ id: "3", type: "coaching" }),
  ];
  const insight = buildMemberFeedbackInsight(logs);
  assert.equal(insight.total, 3);
  assert.equal(insight.typeCounts.praise, 1);
  assert.equal(insight.typeCounts.coaching, 2);
});

test("추천 멘트는 로그가 없어도 안내 문구를 반환한다", () => {
  const insight = buildMemberFeedbackInsight([]);
  assert.match(insight.recommendedMent, /최근 피드백 기록이 없어/);
});

test("추천 멘트는 최근 메모를 반영한다", () => {
  const logs: FeedbackLog[] = [
    makeLog({
      type: "improve",
      memo: "회의 전에 안건을 먼저 공유하면 좋겠습니다.",
      createdAt: "2026-03-01T00:00:00.000Z",
    }),
    makeLog({
      id: "2",
      type: "improve",
      memo: "우선순위 기준을 먼저 정리해보면 좋겠습니다.",
      createdAt: "2026-03-02T00:00:00.000Z",
    }),
  ];
  const insight = buildMemberFeedbackInsight(logs);
  assert.match(insight.recommendedMent, /우선순위 기준/);
});

test("추천 멘트는 400자 이내다", () => {
  const logs: FeedbackLog[] = [
    makeLog({
      type: "coaching",
      memo: "리스크를 먼저 정리하고 공유하면 실행이 더 안정적입니다.",
      createdAt: "2026-03-02T00:00:00.000Z",
    }),
  ];
  const insight = buildMemberFeedbackInsight(logs);
  assert.ok(insight.recommendedMent.length <= 400);
});

test("다음 액션 플랜을 함께 반환한다", () => {
  const logs: FeedbackLog[] = [
    makeLog({
      type: "praise",
      memo: "고객 이슈 정리가 명확해서 팀 이해도가 높아졌습니다.",
    }),
  ];
  const insight = buildMemberFeedbackInsight(logs);
  assert.ok(insight.nextActionPlan.length > 0);
});

test("추천 멘트는 충분히 상세하게 320~400자 범위로 생성된다", () => {
  const logs: FeedbackLog[] = [
    makeLog({
      type: "growth",
      memo: "고객 요구사항을 구조적으로 정리해 팀 커뮤니케이션이 명확해졌습니다.",
      createdAt: "2026-03-03T00:00:00.000Z",
    }),
    makeLog({
      id: "2",
      type: "coaching",
      memo: "과제 착수 전 리스크를 먼저 정리하면 실행 안정성이 높아집니다.",
      createdAt: "2026-03-04T00:00:00.000Z",
    }),
  ];
  const insight = buildMemberFeedbackInsight(logs);
  assert.ok(insight.recommendedMent.length >= 320, `${insight.recommendedMent.length}`);
  assert.ok(insight.recommendedMent.length <= 400, `${insight.recommendedMent.length}`);
});

test("액션 플랜은 220~300자 범위로 생성된다", () => {
  const logs: FeedbackLog[] = [
    makeLog({
      type: "improve",
      memo: "우선순위 공유 시점을 앞당기면 협업 지연이 줄어듭니다.",
    }),
  ];
  const insight = buildMemberFeedbackInsight(logs);
  assert.ok(insight.nextActionPlan.length >= 220, `${insight.nextActionPlan.length}`);
  assert.ok(insight.nextActionPlan.length <= 300, `${insight.nextActionPlan.length}`);
});
