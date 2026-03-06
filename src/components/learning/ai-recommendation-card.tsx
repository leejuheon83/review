import type { LearningRecommendation } from "@/lib/learning-recommendation";

type AIRecommendationCardProps = {
  recommendation: LearningRecommendation;
};

export default function AIRecommendationCard({ recommendation }: AIRecommendationCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">AI 추천</p>
      <h2 className="mt-2 text-xl font-bold text-gray-900">{recommendation.headline}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{recommendation.reason}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {recommendation.focusArea === "feedback" ? "피드백 우선" : "1:1 우선"}
        </span>
        {recommendation.recommendedContentIds.map((id) => (
          <span key={id} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {id}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-emerald-50 p-4">
        <p className="text-xs font-semibold text-emerald-700">실행 팁</p>
        <p className="mt-1 text-sm text-gray-700">{recommendation.actionTip}</p>
      </div>
    </section>
  );
}
