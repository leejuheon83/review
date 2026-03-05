import { db, ensureDbReady } from "@/lib/db";
import type { FeedbackLog, FeedbackType, User } from "@/lib/types";

type Store = Pick<typeof db, "employees" | "logs">;

export class SuggestedPhrasePermissionError extends Error {
  constructor(message = "권한이 없습니다.") {
    super(message);
    this.name = "SuggestedPhrasePermissionError";
  }
}

export class SuggestedPhraseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuggestedPhraseValidationError";
  }
}

type GenerateSuggestedPhrasesInput = {
  actor: User;
  employeeId: string;
  feedbackType: FeedbackType;
  tags?: string[];
  context?: string;
  store?: Store;
};

function clipMemo(input: string): string {
  const value = input.replace(/\s+/g, " ").trim();
  return value.length > 200 ? `${value.slice(0, 197)}...` : value;
}

function enforceSentenceLength(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length < 30) {
    return `${normalized} 다음 1:1에서 실행 결과를 함께 확인해봅시다.`;
  }
  if (normalized.length > 120) {
    return `${normalized.slice(0, 117)}...`;
  }
  return normalized;
}

function topTags(logs: FeedbackLog[]): string {
  const map = new Map<string, number>();
  for (const log of logs) {
    for (const tag of log.tags) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return (
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag)
      .join(", ") || "업무 실행"
  );
}

function recentSignals(logs: FeedbackLog[]): string {
  const quote = logs
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((l) => clipMemo(l.memo))
    .find(Boolean);
  return quote || "최근 업무 진행 내용";
}

function makePhrases(input: {
  feedbackType: FeedbackType;
  employeeName: string;
  context?: string;
  tagsText: string;
  signal: string;
}): string[] {
  const base = input.context?.trim() || input.signal;
  if (input.feedbackType === "praise") {
    return [
      `이번 ${base}에서 핵심 내용을 명확히 정리해줘서 팀이 빠르게 같은 방향으로 움직일 수 있었습니다.`,
      `최근 ${input.tagsText} 관련 실행이 안정적이어서 협업 속도와 결과 품질에 긍정적인 영향을 주었습니다.`,
      `${input.employeeName}님이 보여준 구체적 행동이 팀 의사결정 시간을 줄이는 데 실제로 도움이 되었습니다.`,
    ];
  }
  if (input.feedbackType === "growth") {
    return [
      `최근 강점인 ${input.tagsText}를 다음 프로젝트에서도 재사용할 수 있도록 본인 방식으로 한 번 정리해보면 좋겠습니다.`,
      `${base}에서 보인 실행력을 바탕으로, 다음 단계에서는 우선순위 기준까지 함께 제시해보는 확장을 권합니다.`,
      `지금의 안정적인 수행 역량에 더해, 진행 중 리스크와 대안을 먼저 공유하는 습관을 가져가면 성장 폭이 커질 것입니다.`,
    ];
  }
  if (input.feedbackType === "improve") {
    return [
      `${base} 과정에서 핵심 안건을 사전에 한 줄로 공유하면 논의가 더 짧고 명확하게 진행될 것 같습니다.`,
      `최근 업무 흐름을 보면 ${input.tagsText} 관련 정보 공유 시점을 조금만 앞당겨도 팀 전체 실행력이 높아질 수 있습니다.`,
      `다음 액션으로 시작 전에 우선순위와 완료 기준을 함께 정리해보면 재작업을 줄이는 데 도움이 됩니다.`,
    ];
  }
  if (input.feedbackType === "coaching") {
    return [
      `${base}를 준비할 때 먼저 예상 리스크 3가지를 적어본다면, 실행 중 판단이 훨씬 빨라질 것 같아요.`,
      `이번 주에는 ${input.tagsText} 관점에서 '지금 바로 개선할 1가지'를 정해보고, 다음 1:1에서 결과를 함께 점검해볼까요?`,
      `다음 과제를 시작하기 전에 필요한 지원과 의사결정 포인트를 먼저 정리해보면 더 안정적으로 진행할 수 있습니다.`,
    ];
  }
  return [
    `${base} 관련 진행 상황을 매일 짧게 공유해주면 협업 리듬을 맞추는 데 큰 도움이 됩니다.`,
    `최근 ${input.tagsText} 중심의 실행이 이어지고 있으니, 다음에는 완료 기준까지 함께 명확히 적어보면 좋겠습니다.`,
    `다음 액션으로 오늘 해야 할 우선순위 3가지를 먼저 정리하고, 종료 시점에 결과를 간단히 회고해봅시다.`,
  ];
}

export async function generateSuggestedPhrases(
  input: GenerateSuggestedPhrasesInput,
): Promise<{ suggestions: string[] }> {
  await ensureDbReady();
  const store = input.store || db;
  if (!input.employeeId) {
    throw new SuggestedPhraseValidationError("대상 팀원을 선택해 주세요.");
  }
  if (!input.feedbackType) {
    throw new SuggestedPhraseValidationError("피드백 유형을 선택해 주세요.");
  }
  const context = (input.context || "").trim();
  if (context.length > 120) {
    throw new SuggestedPhraseValidationError("상황 설명은 120자 이내로 입력해 주세요.");
  }

  const employee = store.employees.find((e) => e.id === input.employeeId);
  if (!employee) {
    throw new SuggestedPhraseValidationError("팀원을 찾을 수 없습니다.");
  }

  if (input.actor.role === "MANAGER" && employee.managerId !== input.actor.id) {
    throw new SuggestedPhrasePermissionError("본인 팀원에 대해서만 추천 문구를 생성할 수 있습니다.");
  }

  const now = Date.now();
  const logs = store.logs
    .filter((l) => l.employeeId === employee.id)
    .filter((l) => now - new Date(l.createdAt).getTime() <= 90 * 24 * 60 * 60 * 1000)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const tagsText = input.tags && input.tags.length > 0 ? input.tags.join(", ") : topTags(logs);
  const signal = recentSignals(logs);
  const raw = makePhrases({
    feedbackType: input.feedbackType,
    employeeName: employee.name,
    context,
    tagsText,
    signal,
  });

  const suggestions = raw.map(enforceSentenceLength).slice(0, 3);
  return { suggestions };
}
