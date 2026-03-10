import { learningContents } from "@/lib/learning-content";

export type LeadershipAssessmentInput = {
  direction?: number;
  coaching?: number;
  decision?: number;
  communication?: number;
  motivation?: number;
  execution?: number;
};

export type FeedbackRecord = {
  id: string;
  memberId: string;
  type: "praise" | "improve" | "note";
  content: string;
  createdAt?: string;
};

export type OneOnOneRecord = {
  id: string;
  memberId: string;
  createdAt?: string;
};

export type RecommendationActionItem = {
  title: string;
  description: string;
};

export type LearningRecommendation = {
  headline: string;
  reason: string;
  /** 리더십 진단·리뷰 기록 기반 근거 요약 */
  basis: string[];
  recommendedContentIds: string[];
  focusArea: "feedback" | "oneonone";
  actionGuideTitle: string;
  actionGuideSummary: string;
  actionItems: RecommendationActionItem[];
};

function countFeedback(feedbacks: FeedbackRecord[]) {
  const praiseCount = feedbacks.filter((item) => item.type === "praise").length;
  const improveCount = feedbacks.filter((item) => item.type === "improve").length;
  const totalCount = feedbacks.length;

  return {
    praiseCount,
    improveCount,
    totalCount,
  };
}

export function buildLearningRecommendation(params: {
  leadership?: LeadershipAssessmentInput;
  feedbacks?: FeedbackRecord[];
  oneOnOnes?: OneOnOneRecord[];
}): LearningRecommendation {
  const leadership = params.leadership ?? {};
  const feedbacks = params.feedbacks ?? [];
  const oneOnOnes = params.oneOnOnes ?? [];

  const { praiseCount, improveCount, totalCount } = countFeedback(feedbacks);

  const coachingScore = leadership.coaching ?? 3;
  const directionScore = leadership.direction ?? 3;
  const communicationScore = leadership.communication ?? 3;

  const buildBasis = (): string[] => {
    const items: string[] = [];
    if (leadership.coaching != null || leadership.direction != null || leadership.communication != null) {
      const parts: string[] = [];
      if (leadership.coaching != null) parts.push(`코칭 ${coachingScore}점`);
      if (leadership.direction != null) parts.push(`방향 제시 ${directionScore}점`);
      if (leadership.communication != null) parts.push(`커뮤니케이션 ${communicationScore}점`);
      if (parts.length > 0) items.push(`리더십 진단: ${parts.join(", ")}`);
    }
    if (totalCount > 0) {
      items.push(`리뷰 기록: 총 ${totalCount}건 (칭찬 ${praiseCount}건, 개선 ${improveCount}건)`);
    }
    if (oneOnOnes.length > 0) {
      items.push(`1:1 기록: 최근 ${oneOnOnes.length}건`);
    }
    return items.length > 0 ? items : ["저장된 진단·리뷰가 없어 기본 추천을 드려요."];
  };

  if (coachingScore <= 3 || (totalCount > 0 && praiseCount === 0)) {
    return {
      headline: "피드백 스킬을 먼저 강화해보세요",
      reason:
        praiseCount === 0
          ? "최근 피드백 기록에 칭찬 피드백이 거의 없어요. 팀원의 좋은 행동을 구체적으로 강화하는 연습이 먼저 필요해 보여요."
          : "리더십 진단에서 코칭/피드백 영역 점수가 낮아요. 구조화된 피드백 프레임을 먼저 익히는 것이 좋아요.",
      basis: buildBasis(),
      recommendedContentIds: ["sbi-feedback", "positive-feedback", "radical-candor"],
      focusArea: "feedback",
      actionGuideTitle: "실행 가이드",
      actionGuideSummary:
        "지금은 피드백의 양보다 방식이 더 중요해요. 짧더라도 구체적이고, 행동 중심으로, 바로 다시 실천할 수 있게 말해주는 것이 핵심이에요. 이번 주에는 완벽한 평가보다 '좋았던 행동 1개를 정확히 짚어주는 것'부터 시작해보세요.",
      actionItems: [
        {
          title: "좋았던 상황을 먼저 짚어주세요",
          description:
            "칭찬 피드백을 줄 때는 먼저 언제, 어떤 상황이었는지 말해보세요. 상황이 들어가면 팀원이 '무엇을 잘했는지'를 더 선명하게 이해할 수 있어요.",
        },
        {
          title: "사람이 아니라 행동을 기준으로 말하세요",
          description:
            "막연하게 '잘했어요'라고 말하기보다, 실제로 본 행동을 구체적으로 설명해보세요. 예를 들면 '오늘 회의에서 고객 질문을 먼저 정리해줘서 흐름이 좋아졌어요'처럼 말하는 방식이 좋아요.",
        },
        {
          title: "다음에도 반복하면 좋은 행동을 한 문장으로 덧붙이세요",
          description:
            "피드백의 목적은 좋은 행동을 강화하는 거예요. 마지막에 '다음에도 이 방식으로 진행하면 좋겠어요'처럼 기대 행동을 짧게 덧붙이면 훨씬 실전적인 코칭이 됩니다.",
        },
      ],
    };
  }

  if (oneOnOnes.length < 2) {
    return {
      headline: "1:1 미팅 루틴을 다시 세팅해보세요",
      reason:
        "최근 1:1 기록이 많지 않아요. 팀원 상태를 이해하고 지원하기 위한 기본 루틴부터 잡는 것이 좋아요.",
      basis: buildBasis(),
      recommendedContentIds: ["oneonone-flow", "oneonone-questions"],
      focusArea: "oneonone",
      actionGuideTitle: "실행 가이드",
      actionGuideSummary:
        "좋은 1:1은 길고 무거운 미팅이 아니라, 팀원의 상태를 꾸준히 확인하는 짧고 안정적인 루틴이에요. 지금은 미팅의 깊이보다도 '정기적으로 대화하는 흐름'을 다시 만드는 것이 더 중요해 보여요.",
      actionItems: [
        {
          title: "짧아도 좋으니 이번 주 1:1 일정을 먼저 잡아보세요",
          description:
            "30분이 부담되면 15~20분으로 시작해도 충분해요. 중요한 건 완성도보다 반복 가능한 루틴을 다시 만드는 거예요.",
        },
        {
          title: "업무 보고보다 상태 확인 질문으로 먼저 시작하세요",
          description:
            "미팅 초반에는 '요즘 가장 에너지가 많이 드는 일이 뭐예요?' 같은 질문으로 팀원의 실제 상태를 먼저 확인해보세요. 이 질문 하나가 대화의 깊이를 크게 바꿔줘요.",
        },
        {
          title: "마지막에는 다음 액션 한 줄을 꼭 남기세요",
          description:
            "1:1이 끝난 뒤에는 '다음 주까지 우선순위 다시 정리하기'처럼 실행 가능한 한 줄 메모를 남겨보세요. 기록이 있어야 다음 대화가 이어집니다.",
        },
      ],
    };
  }

  if (directionScore <= 3 || communicationScore <= 3 || improveCount > praiseCount * 2) {
    return {
      headline: "피드백의 톤과 대화 구조를 다듬어보세요",
      reason:
        "개선 중심 대화 비중이 높거나, 방향 제시/커뮤니케이션 점수가 낮아요. 명확하면서도 수용 가능한 대화 방식이 중요해 보여요.",
      basis: buildBasis(),
      recommendedContentIds: ["radical-candor", "sbi-feedback", "oneonone-questions"],
      focusArea: "feedback",
      actionGuideTitle: "실행 가이드",
      actionGuideSummary:
        "지금은 피드백의 '내용'보다 '전달 방식'을 먼저 다듬는 것이 좋아요. 같은 메시지라도 상황과 행동을 분리해서 말하고, 마지막에 기대하는 다음 행동을 덧붙이면 팀원이 훨씬 덜 방어적으로 받아들일 수 있어요. 개선 피드백은 짧고 명확하게, 그리고 다음 행동까지 연결해주는 것이 핵심입니다.",
      actionItems: [
        {
          title: "상황을 먼저 설명하세요",
          description:
            "피드백을 시작할 때는 언제, 어떤 장면에서 있었던 일인지 먼저 이야기해보세요. 상황을 먼저 깔아주면 팀원이 맥락을 이해하기 쉬워지고, 감정적으로 받아들이기보다 사실 중심으로 듣게 됩니다.",
        },
        {
          title: "행동을 구체적으로 말하세요",
          description:
            "사람을 평가하지 말고 실제로 관찰한 행동을 설명하세요. 예를 들면 '보고가 늦었어요'보다 '어제 고객 미팅 자료가 미팅 직전에 공유되었습니다'처럼 말하는 방식이 더 정확하고 수용 가능성이 높아요.",
        },
        {
          title: "기대 행동을 한 문장으로 정리하세요",
          description:
            "마지막에는 다음에 어떤 행동을 기대하는지 짧게 제안해보세요. 예를 들면 '다음에는 하루 전에 공유해주면 더 좋겠습니다'처럼 말하면 피드백이 비판으로 끝나지 않고 코칭으로 연결됩니다.",
        },
      ],
    };
  }

  return {
    headline: "좋은 루틴을 유지하면서 1:1 질문의 질을 높여보세요",
    reason:
      "현재는 전반적으로 운영이 안정적이에요. 이제는 더 깊은 대화를 이끌 수 있는 질문과 코칭 대화의 질을 높이는 것이 좋아요.",
    basis: buildBasis(),
    recommendedContentIds: ["oneonone-questions", "positive-feedback", "radical-candor"],
    focusArea: "oneonone",
    actionGuideTitle: "실행 가이드",
    actionGuideSummary:
      "기본 루틴은 이미 잘 잡혀 있어요. 이제는 대화를 더 깊게 만드는 질문과, 팀원이 스스로 생각을 꺼낼 수 있게 돕는 코칭 방식에 조금 더 집중해보면 좋아요.",
    actionItems: [
      {
        title: "업무 진행보다 생각을 묻는 질문을 늘려보세요",
        description:
          "'지금 뭐가 가장 중요한가요?' '어디에서 가장 막히고 있나요?' 같은 질문은 단순 상태 확인을 넘어서 팀원의 판단과 고민을 꺼내게 도와줘요.",
      },
      {
        title: "팀장 본인에 대한 피드백 질문도 넣어보세요",
        description:
          "'제가 팀장으로서 더 잘할 수 있는 점이 있을까요?' 같은 질문은 신뢰를 만들고, 1:1을 일방적인 점검 시간이 아니라 상호적인 대화로 바꿔줍니다.",
      },
      {
        title: "대화 끝에는 다음 한 걸음을 함께 정리하세요",
        description:
          "좋은 1:1은 대화로 끝나지 않아요. 오늘 나온 이야기 중 하나를 골라, 다음 주까지 해볼 행동을 한 줄로 남기면 훨씬 실행력 있는 미팅이 됩니다.",
      },
    ],
  };
}

export function getRecommendedContents(ids: string[]) {
  return ids
    .map((id) => learningContents.find((content) => content.id === id))
    .filter((content): content is (typeof learningContents)[number] => Boolean(content));
}
