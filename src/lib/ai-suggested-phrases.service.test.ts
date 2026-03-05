import test from "node:test";
import assert from "node:assert/strict";
import type { Employee, FeedbackLog, User } from "@/lib/types";
import {
  generateSuggestedPhrases,
  SuggestedPhrasePermissionError,
  SuggestedPhraseValidationError,
} from "@/lib/ai-suggested-phrases.service";

type TestStore = {
  users: User[];
  employees: Employee[];
  logs: FeedbackLog[];
};

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function createFixture(): {
  store: TestStore;
  managerA: User;
  managerB: User;
  hr: User;
} {
  const managerA: User = { id: "mgr_a", name: "매니저A", role: "MANAGER", teamId: "team_a" };
  const managerB: User = { id: "mgr_b", name: "매니저B", role: "MANAGER", teamId: "team_b" };
  const hr: User = { id: "hr_1", name: "HR", role: "HR" };
  const employees: Employee[] = [
    { id: "emp_1", name: "김민수", role: "개발", teamId: "team_a", managerId: "mgr_a", active: true },
    { id: "emp_2", name: "이수진", role: "디자인", teamId: "team_b", managerId: "mgr_b", active: true },
  ];
  const logs: FeedbackLog[] = [
    {
      id: "log_1",
      employeeId: "emp_1",
      managerId: "mgr_a",
      type: "praise",
      memo: "고객 미팅 핵심 요약이 명확해 협업 속도가 올라갔습니다.",
      tags: ["고객대응", "협업"],
      pinned: false,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      id: "log_2",
      employeeId: "emp_1",
      managerId: "mgr_a",
      type: "coaching",
      memo: "신규 업무 시작 전에 리스크 3개를 먼저 정리해보면 좋겠습니다.",
      tags: ["책임감"],
      pinned: false,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  ];
  return { store: { users: [managerA, managerB, hr], employees, logs }, managerA, managerB, hr };
}

test("권한 없는 팀원 요청은 차단된다", async () => {
  const { store, managerA } = createFixture();
  await assert.rejects(
    () =>
      generateSuggestedPhrases({
        actor: managerA,
        employeeId: "emp_2",
        feedbackType: "coaching",
        store,
      }),
    SuggestedPhrasePermissionError,
  );
});

test("context 120자 초과 시 검증 에러가 발생한다", async () => {
  const { store, managerA } = createFixture();
  await assert.rejects(
    () =>
      generateSuggestedPhrases({
        actor: managerA,
        employeeId: "emp_1",
        feedbackType: "praise",
        context: "가".repeat(121),
        store,
      }),
    SuggestedPhraseValidationError,
  );
});

test("추천 문구는 정확히 3개 생성된다", async () => {
  const { store, managerA } = createFixture();
  const result = await generateSuggestedPhrases({
    actor: managerA,
    employeeId: "emp_1",
    feedbackType: "coaching",
    context: "이번 주 고객 미팅 발표 진행",
    store,
  });
  assert.equal(result.suggestions.length, 3);
});

test("추천 문구 길이는 30~120자를 준수한다", async () => {
  const { store, hr } = createFixture();
  const result = await generateSuggestedPhrases({
    actor: hr,
    employeeId: "emp_1",
    feedbackType: "improve",
    store,
  });
  for (const sentence of result.suggestions) {
    assert.ok(sentence.length >= 30, `too short: ${sentence}`);
    assert.ok(sentence.length <= 120, `too long: ${sentence}`);
  }
});
