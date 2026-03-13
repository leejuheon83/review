import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import type { Employee, FeedbackLog, Summary, SummaryFilters, User } from "@/lib/types";

const INSUFFICIENT_MESSAGE =
  "요약할 기록이 충분하지 않습니다. 최근 코칭 로그를 2건 이상 남긴 뒤 다시 시도해 주세요.";
const MODEL_VERSION = "coaching-summary-v1";

type Store = Pick<typeof db, "users" | "employees" | "logs" | "summaries">;

export class SummaryPermissionError extends Error {
  constructor(message = "요약 권한이 없습니다.") {
    super(message);
    this.name = "SummaryPermissionError";
  }
}

export class SummaryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SummaryValidationError";
  }
}

type GenerateSummaryInput = {
  actor: User;
  employeeId: string;
  filters: SummaryFilters;
  regenerate?: boolean;
  store?: Store;
};

type GenerateSummaryResult = {
  status: "generated" | "cached" | "insufficient";
  summary: Summary;
  usedLogs: FeedbackLog[];
  prompt: string;
};

function normalizeFilters(filters: SummaryFilters): SummaryFilters {
  const startDate = filters.startDate;
  const endDate = filters.endDate;
  const type = filters.type && filters.type !== "all" ? filters.type : undefined;
  const tags = filters.tags?.filter(Boolean).map((t) => t.trim()).filter(Boolean) || [];
  return {
    startDate,
    endDate,
    type,
    tags: tags.length > 0 ? Array.from(new Set(tags)).sort() : undefined,
  };
}

function toStartOfDay(value: string): number {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

function toEndOfDay(value: string): number {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

function eqFilters(a: SummaryFilters, b: SummaryFilters): boolean {
  const aNorm = normalizeFilters(a);
  const bNorm = normalizeFilters(b);
  return JSON.stringify(aNorm) === JSON.stringify(bNorm);
}

function ensurePermission(actor: User, employee: Employee) {
  if (actor.role === "HR") return;
  if (actor.role === "MANAGER" && employee.managerId === actor.id) return;
  throw new SummaryPermissionError("해당 팀원에 대한 요약 권한이 없습니다.");
}

function pickLogs(logs: FeedbackLog[], filters: SummaryFilters): FeedbackLog[] {
  const startTs = toStartOfDay(filters.startDate);
  const endTs = toEndOfDay(filters.endDate);
  const byFilter = logs.filter((log) => {
    const ts = new Date(log.createdAt).getTime();
    if (ts < startTs || ts > endTs) return false;
    if (filters.type && filters.type !== "all" && log.type !== filters.type) return false;
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some((tag) => log.tags.includes(tag));
      if (!hasTag) return false;
    }
    return true;
  });
  return byFilter
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function clipMemo(input: string): string {
  const value = input.replace(/\s+/g, " ").trim();
  return value.length > 300 ? `${value.slice(0, 297)}...` : value;
}

function buildEvidence(logs: FeedbackLog[]): {
  typeDist: string;
  topTags: string;
  quotes: string[];
} {
  const typeMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  for (const log of logs) {
    typeMap.set(log.type, (typeMap.get(log.type) || 0) + 1);
    for (const tag of log.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  const typeDist = Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");
  const topTags = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => `${tag}(${count})`)
    .join(", ");
  const quotes = logs
    .slice()
    .sort((a, b) => b.memo.length - a.memo.length)
    .slice(0, 2)
    .map((l) => `"${clipMemo(l.memo).slice(0, 60)}"`);
  return {
    typeDist: typeDist || "없음",
    topTags: topTags || "없음",
    quotes,
  };
}

export function buildSummaryPrompt(
  employeeName: string,
  filters: SummaryFilters,
  logs: FeedbackLog[],
): string {
  const list = logs
    .map((log) => {
      const date = new Date(log.createdAt).toISOString().slice(0, 10);
      return `- ${date} | ${log.type} | ${log.tags.join("|") || "-"} | ${clipMemo(log.memo)}`;
    })
    .join("\n");
  return `You are an HR coaching assistant. Summarize coaching feedback logs into a concise, neutral, actionable coaching summary.
Rules:
- Do not infer personality, medical, mental health, private life, or protected traits.
- Use only information explicitly in the logs.
- Avoid harsh language. No diagnosing. No speculation.
- If information is insufficient, say so.

Output exactly in this structure:
[강점]
- ...
[성장 포인트]
- ...
[다음 코칭 액션]
- ...
[근거]
- 유형 분포: ...
- 상위 태그: ...
- 인용(최대 2개): "..."

INPUT:
Employee: ${employeeName}
Period: ${filters.startDate} - ${filters.endDate}
Logs (oldest → newest):
${list}`;
}

function generateSummaryText(logs: FeedbackLog[]): string {
  if (logs.length < 2) return INSUFFICIENT_MESSAGE;
  const evidence = buildEvidence(logs);
  const strengths = logs
    .filter((l) => l.type === "praise" || l.type === "growth")
    .slice(-2)
    .map((l) => `- ${clipMemo(l.memo).slice(0, 44)}`);
  const growth = logs
    .filter((l) => l.type === "improve" || l.type === "coaching")
    .slice(-2)
    .map((l) => `- ${clipMemo(l.memo).slice(0, 44)}`);
  const actions = logs
    .slice(-2)
    .map((l) => `- 다음 1:1에서 '${clipMemo(l.memo).slice(0, 24)}' 진행상황 점검`);

  return [
    "[강점]",
    ...(strengths.length > 0 ? strengths : ["- 성과 공유와 커뮤니케이션 관련 긍정 신호가 확인됩니다."]),
    "[성장 포인트]",
    ...(growth.length > 0 ? growth : ["- 실행 우선순위와 리스크 점검을 정례화할 필요가 있습니다."]),
    "[다음 코칭 액션]",
    ...actions,
    "[근거]",
    `- 유형 분포: ${evidence.typeDist}`,
    `- 상위 태그: ${evidence.topTags}`,
    `- 인용(최대 2개): ${evidence.quotes.join(", ") || '"해당 없음"'}`,
  ].join("\n");
}

function isSameSourceIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

function makeSourceFingerprint(logs: FeedbackLog[]): string {
  return logs.map((log) => `${log.id}:${log.updatedAt}`).join("|");
}

export async function generateEmployeeSummary(
  input: GenerateSummaryInput,
): Promise<GenerateSummaryResult> {
  await ensureDbReady();
  const store = input.store || db;
  const employee = store.employees.find((e) => e.id === input.employeeId);
  if (!employee) throw new SummaryValidationError("팀원을 찾을 수 없습니다.");
  ensurePermission(input.actor, employee);

  const filters = normalizeFilters(input.filters);
  if (!filters.startDate || !filters.endDate) {
    throw new SummaryValidationError("시작일/종료일이 필요합니다.");
  }

  const logs = pickLogs(
    store.logs.filter((log) => log.employeeId === input.employeeId),
    filters,
  );
  const sourceLogIds = logs.map((log) => log.id);
  const sourceFingerprint = makeSourceFingerprint(logs);
  const prompt = buildSummaryPrompt(employee.name, filters, logs);

  const existing = store.summaries.find(
    (s) => s.scopeType === "EMPLOYEE" && s.scopeId === input.employeeId && eqFilters(s.filters, filters),
  );

  if (existing && !input.regenerate) {
    if (
      isSameSourceIds(existing.sourceLogIds, sourceLogIds) &&
      existing.sourceFingerprint === sourceFingerprint
    ) {
      return { status: "cached", summary: existing, usedLogs: logs, prompt };
    }
  }

  const now = new Date().toISOString();
  const summaryText = generateSummaryText(logs);
  const status = logs.length < 2 ? "insufficient" : "generated";

  const summary: Summary = existing
    ? {
        ...existing,
        sourceLogIds,
        sourceFingerprint,
        summaryText,
        modelVersion: MODEL_VERSION,
        createdByUserId: input.actor.id,
        updatedAt: now,
        filters,
      }
    : {
        id: `summary_${Date.now()}`,
        scopeType: "EMPLOYEE" as const,
        scopeId: input.employeeId,
        filters,
        sourceLogIds,
        sourceFingerprint,
        summaryText,
        modelVersion: MODEL_VERSION,
        createdByUserId: input.actor.id,
        createdAt: now,
        updatedAt: now,
      };

  if (input.store) {
    if (existing) {
      Object.assign(existing, summary);
    } else {
      store.summaries.unshift(summary);
    }
    return { status, summary, usedLogs: logs, prompt };
  }

  await mutateDbWithTransaction((state) => {
    const summaries = Array.isArray(state.summaries) ? [...state.summaries] : [];
    const idx = summaries.findIndex(
      (s) =>
        s.scopeType === "EMPLOYEE" &&
        s.scopeId === input.employeeId &&
        eqFilters(s.filters, filters),
    );
    if (idx >= 0) {
      summaries[idx] = summary;
    } else {
      summaries.unshift(summary);
    }
    return { ...state, summaries };
  });

  return { status, summary, usedLogs: logs, prompt };
}
