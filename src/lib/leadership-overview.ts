import {
  getCategoryAverages,
  getResultLabel,
  type LeadershipScores,
  type LeadershipCategory,
} from "@/lib/leadership";

type LeadershipAssessmentLike = {
  totalScore: number;
  scores?: Record<string, number>;
} | null;

type LeadershipOverview = {
  totalScore: number;
  resultLabel: string;
  categoryAverages: Array<{ category: LeadershipCategory; average: number }>;
};

function isQuestionScoreShape(scores: Record<string, number>): scores is LeadershipScores {
  return ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"].every(
    (key) => typeof scores[key] === "number",
  );
}

export function buildLeadershipOverview(
  assessment: LeadershipAssessmentLike,
): LeadershipOverview | null {
  if (!assessment) return null;
  const totalScore = Number(assessment.totalScore || 0);
  const resultLabel = getResultLabel(totalScore);

  if (assessment.scores && isQuestionScoreShape(assessment.scores)) {
    return {
      totalScore,
      resultLabel,
      categoryAverages: getCategoryAverages(assessment.scores),
    };
  }

  return {
    totalScore,
    resultLabel,
    categoryAverages: [
      { category: "방향 제시", average: 0 },
      { category: "모범", average: 0 },
      { category: "코칭/성장", average: 0 },
      { category: "의사결정/실행", average: 0 },
      { category: "신뢰/동기부여", average: 0 },
    ],
  };
}
