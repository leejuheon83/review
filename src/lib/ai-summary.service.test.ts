import test from "node:test";
import assert from "node:assert/strict";
import type { Employee, FeedbackLog, User } from "@/lib/types";
import { generateEmployeeSummary, SummaryPermissionError } from "@/lib/ai-summary.service";

type TestStore = {
  users: User[];
  employees: Employee[];
  logs: FeedbackLog[];
  summaries: Array<{
    id: string;
    scopeType: "EMPLOYEE" | "TEAM";
    scopeId: string;
    filters: { startDate: string; endDate: string; type?: string; tags?: string[] };
    sourceLogIds: string[];
    summaryText: string;
    modelVersion: string;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
  }>;
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
      memo: "고객 미팅 정리가 명확해서 좋았습니다.",
      tags: ["고객대응"],
      pinned: false,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      id: "log_2",
      employeeId: "emp_1",
      managerId: "mgr_a",
      type: "coaching",
      memo: "다음 과제 시작 전에 리스크 3개를 먼저 작성해보세요.",
      tags: ["책임감"],
      pinned: false,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
  ];
  return {
    managerA,
    managerB,
    hr,
    store: {
      users: [managerA, managerB, hr],
      employees,
      logs,
      summaries: [],
    },
  };
}

test("매니저는 본인 팀원이 아니면 요약 생성이 거부된다", async () => {
  const { store, managerA } = createFixture();
  await assert.rejects(
    () =>
      generateEmployeeSummary({
        actor: managerA,
        employeeId: "emp_2",
        filters: { startDate: daysAgo(30).slice(0, 10), endDate: daysAgo(0).slice(0, 10) },
        store,
      }),
    SummaryPermissionError,
  );
});

test("HR은 모든 팀원에 대해 요약 생성 가능하다", async () => {
  const { store, hr } = createFixture();
  const result = await generateEmployeeSummary({
    actor: hr,
    employeeId: "emp_1",
    filters: { startDate: daysAgo(30).slice(0, 10), endDate: daysAgo(0).slice(0, 10) },
    store,
  });
  assert.equal(result.status, "generated");
  assert.equal(store.summaries.length, 1);
  assert.match(result.summary.summaryText, /\[강점\]/);
});

test("기록이 2건 미만이면 안내 문구를 반환한다", async () => {
  const { store, managerA } = createFixture();
  store.logs = store.logs.slice(0, 1);
  const result = await generateEmployeeSummary({
    actor: managerA,
    employeeId: "emp_1",
    filters: { startDate: daysAgo(30).slice(0, 10), endDate: daysAgo(0).slice(0, 10) },
    store,
  });
  assert.equal(result.status, "insufficient");
  assert.match(result.summary.summaryText, /요약할 기록이 충분하지 않습니다/);
});

test("같은 요청 + 같은 sourceLogIds면 캐시를 반환한다", async () => {
  const { store, managerA } = createFixture();
  const filters = { startDate: daysAgo(30).slice(0, 10), endDate: daysAgo(0).slice(0, 10) };

  const first = await generateEmployeeSummary({
    actor: managerA,
    employeeId: "emp_1",
    filters,
    store,
  });
  const second = await generateEmployeeSummary({
    actor: managerA,
    employeeId: "emp_1",
    filters,
    store,
  });

  assert.equal(first.status, "generated");
  assert.equal(second.status, "cached");
  assert.equal(store.summaries.length, 1);
  assert.equal(first.summary.id, second.summary.id);
});

test("기간 내 로그가 수정되면 stale로 판단해 재생성한다", async () => {
  const { store, managerA } = createFixture();
  const filters = { startDate: daysAgo(30).slice(0, 10), endDate: daysAgo(0).slice(0, 10) };

  const first = await generateEmployeeSummary({
    actor: managerA,
    employeeId: "emp_1",
    filters,
    store,
  });
  const prevText = first.summary.summaryText;

  store.logs[1].memo = "리스크 정리 + 일정 버퍼 계획을 같이 작성해보세요.";
  store.logs[1].updatedAt = new Date().toISOString();

  const second = await generateEmployeeSummary({
    actor: managerA,
    employeeId: "emp_1",
    filters,
    store,
  });

  assert.equal(second.status, "generated");
  assert.equal(store.summaries.length, 1);
  assert.notEqual(second.summary.summaryText, prevText);
});
