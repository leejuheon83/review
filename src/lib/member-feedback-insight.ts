import type { FeedbackLog } from "@/lib/types";

type TypeCounts = {
  praise: number;
  growth: number;
  improve: number;
  coaching: number;
  other: number;
};

type Insight = {
  total: number;
  typeCounts: TypeCounts;
  briefSummary: string;
  recommendedMent: string;
  nextActionPlan: string;
};

function countTypes(logs: FeedbackLog[]): TypeCounts {
  return {
    praise: logs.filter((l) => l.type === "praise").length,
    growth: logs.filter((l) => l.type === "growth").length,
    improve: logs.filter((l) => l.type === "improve").length,
    coaching: logs.filter((l) => l.type === "coaching").length,
    other: logs.filter((l) => l.type === "other").length,
  };
}

function dominantType(counts: TypeCounts): keyof TypeCounts {
  const entries = Object.entries(counts) as Array<[keyof TypeCounts, number]>;
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || "coaching";
}

function clip(input: string, max = 36): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
}

function clipToMax(input: string, max: number): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
}

function fitLength(input: string, min: number, max: number, fillers: string[]): string {
  let text = input.replace(/\s+/g, " ").trim();
  for (const filler of fillers) {
    if (text.length >= min) break;
    text = `${text} ${filler}`.replace(/\s+/g, " ").trim();
  }
  return clipToMax(text, max);
}

function recommendedByType(type: keyof TypeCounts, latestMemo: string): string {
  const signal = clip(latestMemo, 26);
  if (type === "praise") {
    return `최근 피드백을 보면 "${signal}"처럼 관찰 가능한 강점 행동이 반복되고 있습니다. 해당 행동은 팀의 실행 속도와 협업 명확성을 높이는 데 직접적으로 기여하고 있으며, 구성원들이 같은 기준으로 움직이게 만드는 긍정적 효과가 확인됩니다. 다음 코칭에서는 이 강점이 어떤 상황에서 특히 잘 발휘되는지 함께 짚고, 재현 가능한 방식으로 정리해보는 접근이 유효합니다.`;
  }
  if (type === "growth") {
    return `현재 로그에서는 "${signal}"와 같이 이미 확보된 강점이 보이며, 이를 다음 단계 역량으로 확장할 여지가 충분합니다. 단순히 잘한 점을 반복하는 수준을 넘어, 강점이 성과로 연결되는 구조를 본인 언어로 설명하고 실행 기준으로 문서화하면 성장 속도를 높일 수 있습니다. 다음 1:1에서는 강점의 적용 범위를 어디까지 넓힐지 합의하고, 측정 가능한 목표와 점검 시점을 함께 설정하는 것이 좋습니다.`;
  }
  if (type === "improve") {
    return `최근 기록의 핵심 개선 신호는 "${signal}"로 요약됩니다. 이는 개인 역량 문제가 아니라 업무 흐름과 실행 기준을 조금만 조정하면 빠르게 보완 가능한 영역으로 보입니다. 코칭 시에는 문제를 크게 해석하기보다, 이번 주에 바로 실행할 수 있는 행동 1가지를 구체적으로 정하고 완료 기준을 분명히 두는 방식이 효과적입니다. 다음 점검 시에는 실행 여부와 결과를 짧게 리뷰해 개선 루프를 안정적으로 만드는 데 집중해 주세요.`;
  }
  if (type === "coaching") {
    return `최근 코칭 로그를 종합하면 "${signal}"와 같은 실행 전 정렬 이슈가 반복적으로 관찰됩니다. 따라서 피드백의 초점을 단순 조언보다 행동 설계로 옮기는 것이 중요하며, 착수 전에 우선순위·리스크·완료 기준을 먼저 합의하는 루틴이 필요합니다. 다음 1:1에서는 코칭 내용을 실제 업무 행동으로 연결할 수 있도록 단계별 체크포인트를 정하고, 짧은 주기로 진행상황을 확인하는 방식이 적합합니다.`;
  }
  return `최근 피드백에서는 "${signal}"를 포함한 업무 실행 맥락이 확인됩니다. 현재 단계에서는 평가적 표현보다 관찰 가능한 행동과 결과를 연결해 코칭하는 접근이 효과적이며, 팀 업무 흐름 안에서 바로 적용 가능한 액션을 우선 선정하는 것이 좋습니다. 다음 피드백에서는 무엇을 언제까지 어떤 기준으로 수행할지 명확히 합의하고, 짧은 회고를 통해 개선 포인트를 누적해 주세요.`;
}

function nextActionByType(type: keyof TypeCounts): string {
  if (type === "praise") {
    return "액션 플랜: 이번 주에는 강점으로 확인된 행동을 재현 가능한 실행 항목으로 구체화하세요. 먼저 업무 시작 전에 적용할 체크포인트 2가지를 정하고, 진행 중에는 실제로 적용됐는지 짧게 기록합니다. 주간 1:1에서는 어떤 상황에서 효과가 컸는지와 추가 보완이 필요한 지점을 함께 리뷰해, 다음 주에도 같은 품질로 반복할 수 있도록 팀 기준으로 정리하세요.";
  }
  if (type === "growth") {
    return "액션 플랜: 성장 확장을 위해 2주 단위 목표 1개를 설정하고, 목표 달성 기준을 수치 또는 산출물 형태로 명확히 합의하세요. 실행 첫 주에는 시도 내용과 어려움을 짧게 기록하고, 둘째 주에는 결과와 개선점을 정리해 공유하도록 합니다. 1:1에서는 잘된 점과 다음 확장 포인트를 분리해서 피드백해, 강점이 실제 성과로 연결되는 루틴을 만들도록 지원하세요.";
  }
  if (type === "improve") {
    return "액션 플랜: 개선 이슈를 추상적으로 다루지 말고 이번 주 실행 항목 1개로 전환하세요. 시작 전에 완료 기준과 확인 시점을 먼저 정하고, 중간 점검에서는 진행률과 장애요인을 짧게 확인합니다. 주간 말에는 실제 변화가 있었는지 결과를 리뷰하고, 필요하면 다음 주 액션을 한 단계 더 구체화해 재시도하도록 설계하세요.";
  }
  if (type === "coaching") {
    return "액션 플랜: 코칭 내용을 실행으로 연결하기 위해 착수 전 정렬 루틴을 적용하세요. 업무 시작 전에 우선순위, 예상 리스크, 완료 기준을 먼저 작성하게 하고, 진행 중에는 핵심 변경사항을 한 줄로 공유하도록 합니다. 다음 1:1에서는 계획 대비 실행 차이와 원인을 함께 점검하고, 다음 사이클에서 바로 적용할 보완 행동 1가지를 확정해 실행력을 높이세요.";
  }
  return "액션 플랜: 이번 주 핵심 업무 1건을 기준으로 목표-진행-리스크를 짧게 기록하는 루틴을 도입하세요. 주중에는 진행 상태를 한 번 점검하고 필요 시 우선순위를 조정합니다. 주간 리뷰에서는 무엇이 효과적이었고 무엇이 지연 요인이었는지 함께 정리해, 다음 주 실행 계획을 더 명확한 기준으로 업데이트하세요.";
}

export function buildMemberFeedbackInsight(logs: FeedbackLog[]): Insight {
  if (logs.length === 0) {
    return {
      total: 0,
      typeCounts: { praise: 0, growth: 0, improve: 0, coaching: 0, other: 0 },
      briefSummary: "누적 피드백 기록이 없습니다.",
      recommendedMent: clipToMax(
        "최근 피드백 기록이 없어 상세 추천 멘트를 만들기 어렵습니다. 우선 관찰 가능한 행동 중심으로 코칭 로그를 1~2건 이상 남긴 뒤 다시 확인해 주세요.",
        400,
      ),
      nextActionPlan: clipToMax(
        "액션 플랜: 이번 주에는 구체적 행동과 결과를 중심으로 짧은 코칭 로그를 최소 2건 기록하세요. 다음 점검에서 누적 패턴을 기반으로 실행 계획을 다시 제안하겠습니다.",
        300,
      ),
    };
  }

  const sorted = logs
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const counts = countTypes(sorted);
  const latest = sorted[0];
  const dominant = dominantType(counts);

  return {
    total: sorted.length,
    typeCounts: counts,
    briefSummary: `총 ${sorted.length}건 · 칭찬 ${counts.praise} · 성장 ${counts.growth} · 개선 ${counts.improve} · 코칭 ${counts.coaching}`,
    recommendedMent: fitLength(recommendedByType(dominant, latest.memo), 320, 400, [
      "특히 최근 로그의 문맥을 보면 실행 시점과 공유 방식의 정렬이 성과 차이를 만들고 있어, 코칭 대화에서도 행동 단위를 구체화하는 것이 중요합니다.",
      "다음 피드백에서는 잘된 행동을 재사용 가능한 방식으로 남기고, 보완이 필요한 지점은 단일 액션으로 축소해 실행 가능성을 높여주세요.",
    ]),
    nextActionPlan: fitLength(nextActionByType(dominant), 220, 300, [
      "점검 시에는 결과뿐 아니라 실행 과정에서 막힌 요인도 함께 확인해 다음 사이클 계획에 반영하세요.",
      "가능하면 담당자와 점검 일정을 캘린더에 미리 고정해 실천률을 높여주세요.",
    ]),
  };
}
