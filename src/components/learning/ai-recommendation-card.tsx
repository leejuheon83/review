import type { LearningRecommendation } from "@/lib/learning-recommendation";
import { getLearningContentLabel } from "@/lib/learning-label";

type AIRecommendationCardProps = {
  recommendation: LearningRecommendation;
};

export default function AIRecommendationCard({ recommendation }: AIRecommendationCardProps) {
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">AI 추천</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">{recommendation.headline}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">{recommendation.reason}</p>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm">
          {recommendation.focusArea === "feedback" ? "피드백 우선" : "1:1 우선"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recommendation.recommendedContentIds.map((id) => (
          <span key={id} className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
            {getLearningContentLabel(id)}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-800">{recommendation.actionGuideTitle}</p>
        <p className="mt-2 text-sm leading-6 text-gray-700">{recommendation.actionGuideSummary}</p>

        <div className="mt-4 space-y-4">
          {recommendation.actionItems.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-xl bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {index + 1}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-700">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
