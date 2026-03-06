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

export type LearningRecommendation = {
  headline: string;
  reason: string;
  recommendedContentIds: string[];
  focusArea: "feedback" | "oneonone";
  actionTip: string;
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

  if (coachingScore <= 3 || (totalCount > 0 && praiseCount === 0)) {
    return {
      headline: "피드백 스킬을 먼저 강화해보세요",
      reason:
        praiseCount === 0
          ? "최근 피드백 기록에 칭찬 피드백이 거의 없어요. 팀원의 좋은 행동을 구체적으로 강화하는 연습이 먼저 필요해 보여요."
          : "리더십 진단에서 코칭/피드백 영역 점수가 낮아요. 구조화된 피드백 프레임을 먼저 익히는 것이 좋아요.",
      recommendedContentIds: ["sbi-feedback", "positive-feedback", "radical-candor"],
      focusArea: "feedback",
      actionTip: "이번 주에는 팀원 1명에게 SBI 구조로 짧은 칭찬 피드백 1개를 남겨보세요.",
    };
  }

  if (oneOnOnes.length < 2) {
    return {
      headline: "1:1 미팅 루틴을 다시 세팅해보세요",
      reason:
        "최근 1:1 기록이 많지 않아요. 팀원 상태를 이해하고 지원하기 위한 기본 루틴부터 잡는 것이 좋아요.",
      recommendedContentIds: ["oneonone-flow", "oneonone-questions"],
      focusArea: "oneonone",
      actionTip:
        "이번 주에는 한 명과 20분 1:1을 잡고, '요즘 가장 어려운 일' 질문부터 시작해보세요.",
    };
  }

  if (directionScore <= 3 || communicationScore <= 3 || improveCount > praiseCount * 2) {
    return {
      headline: "피드백의 톤과 대화 구조를 다듬어보세요",
      reason:
        "개선 중심 대화 비중이 높거나, 방향 제시/커뮤니케이션 점수가 낮아요. 명확하면서도 수용 가능한 대화 방식이 중요해 보여요.",
      recommendedContentIds: ["radical-candor", "sbi-feedback", "oneonone-questions"],
      focusArea: "feedback",
      actionTip:
        "개선 피드백을 줄 때는 '상황-행동-영향' 순서로 말하고, 마지막에 기대하는 다음 행동을 한 문장으로 붙여보세요.",
    };
  }

  return {
    headline: "좋은 루틴을 유지하면서 1:1 질문의 질을 높여보세요",
    reason:
      "현재는 전반적으로 운영이 안정적이에요. 이제는 더 깊은 대화를 이끌 수 있는 질문과 코칭 대화의 질을 높이는 것이 좋아요.",
    recommendedContentIds: ["oneonone-questions", "positive-feedback", "radical-candor"],
    focusArea: "oneonone",
    actionTip: "다음 1:1에서는 '내가 팀장으로서 더 잘할 수 있는 점이 있을까요?' 질문을 꼭 넣어보세요.",
  };
}

export function getRecommendedContents(ids: string[]) {
  return ids
    .map((id) => learningContents.find((content) => content.id === id))
    .filter((content): content is (typeof learningContents)[number] => Boolean(content));
}
