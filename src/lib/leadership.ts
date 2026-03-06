export type LeadershipQuestionId =
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "q9"
  | "q10";

export type LeadershipCategory =
  | "방향 제시"
  | "모범"
  | "코칭/성장"
  | "의사결정/실행"
  | "신뢰/동기부여";

export type LeadershipQuestion = {
  id: LeadershipQuestionId;
  category: LeadershipCategory;
  title: string;
  description: string;
};

export type LeadershipScores = Record<LeadershipQuestionId, number>;

export const leadershipQuestions: LeadershipQuestion[] = [
  {
    id: "q1",
    category: "방향 제시",
    title: "팀 목표를 명확하게 설명하고 있다",
    description: "팀이 무엇을 목표로 하는지 팀원이 분명히 이해하도록 돕고 있다.",
  },
  {
    id: "q2",
    category: "방향 제시",
    title: "지금 하는 일이 왜 중요한지 연결해주고 있다",
    description: "업무와 비즈니스 목적을 연결해서 설명하고 있다.",
  },
  {
    id: "q3",
    category: "모범",
    title: "기대하는 업무 태도를 내가 먼저 보여준다",
    description: "책임감, 실행력, 협업 태도를 스스로 실천하고 있다.",
  },
  {
    id: "q4",
    category: "모범",
    title: "어려운 상황에서도 책임을 회피하지 않는다",
    description: "문제가 생겼을 때 팀보다 먼저 책임 있게 대응한다.",
  },
  {
    id: "q5",
    category: "코칭/성장",
    title: "구체적인 피드백을 자주 준다",
    description: "좋았던 점과 개선점을 사례와 함께 전달하고 있다.",
  },
  {
    id: "q6",
    category: "코칭/성장",
    title: "팀원의 강점과 성장을 지원한다",
    description: "강점 활용, 성장 기회, 학습을 도와주고 있다.",
  },
  {
    id: "q7",
    category: "의사결정/실행",
    title: "필요한 순간에 결정을 미루지 않는다",
    description: "의사결정이 필요한 이슈를 오래 끌지 않는다.",
  },
  {
    id: "q8",
    category: "의사결정/실행",
    title: "팀이 막히면 빠르게 실행을 돕는다",
    description: "우선순위 정리, 장애물 제거, 리소스 연결을 해주고 있다.",
  },
  {
    id: "q9",
    category: "신뢰/동기부여",
    title: "팀원이 의견을 편하게 말할 수 있는 분위기를 만든다",
    description: "심리적 안전감을 만들고 경청하고 있다.",
  },
  {
    id: "q10",
    category: "신뢰/동기부여",
    title: "좋은 성과와 노력을 인정하고 칭찬한다",
    description: "성과뿐 아니라 과정의 노력도 자주 인정한다.",
  },
];

export const defaultLeadershipScores: LeadershipScores = {
  q1: 3,
  q2: 3,
  q3: 3,
  q4: 3,
  q5: 3,
  q6: 3,
  q7: 3,
  q8: 3,
  q9: 3,
  q10: 3,
};

export function getTotalScore(scores: LeadershipScores) {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

export function getResultLabel(total: number) {
  if (total >= 40) return "강력한 리더십";
  if (total >= 30) return "안정적 리더십";
  if (total >= 20) return "개선 필요";
  return "리더십 재정비 필요";
}

export function getScoreMeaning(score: number) {
  switch (score) {
    case 1:
      return "전혀 아니다";
    case 2:
      return "가끔 그렇다";
    case 3:
      return "보통이다";
    case 4:
      return "자주 그렇다";
    case 5:
      return "항상 그렇다";
    default:
      return "";
  }
}

export function getCategoryAverages(scores: LeadershipScores) {
  const categoryMap: Record<LeadershipCategory, number[]> = {
    "방향 제시": [],
    "모범": [],
    "코칭/성장": [],
    "의사결정/실행": [],
    "신뢰/동기부여": [],
  };

  leadershipQuestions.forEach((question) => {
    categoryMap[question.category].push(scores[question.id]);
  });

  return Object.entries(categoryMap).map(([category, values]) => ({
    category: category as LeadershipCategory,
    average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)),
  }));
}

export function getStrengthAndFocus(scores: LeadershipScores) {
  const categories = getCategoryAverages(scores).sort((a, b) => b.average - a.average);

  return {
    strength: categories[0],
    focus: categories[categories.length - 1],
  };
}

export function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}
