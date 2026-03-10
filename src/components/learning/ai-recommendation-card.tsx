import type { LearningRecommendation } from "@/lib/learning-recommendation";
import { getLearningContentLabel } from "@/lib/learning-label";
import { learningContents } from "@/lib/learning";

type AIRecommendationCardProps = {
  recommendation: LearningRecommendation;
};

function getContentCategory(id: string): "feedback" | "oneonone" {
  const c = learningContents.find((x) => x.id === id);
  return c?.category ?? "feedback";
}

export default function AIRecommendationCard({ recommendation }: AIRecommendationCardProps) {
  const byFeedback = recommendation.recommendedContentIds.filter((id) => getContentCategory(id) === "feedback");
  const byOneOnOne = recommendation.recommendedContentIds.filter((id) => getContentCategory(id) === "oneonone");

  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-lg shadow-indigo-100/50 sm:p-6">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-indigo-200/30 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-violet-200/30 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
            <span aria-hidden>✨</span>
            AI 추천 자료
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">{recommendation.headline}</h2>
          <p className="mt-3 max-w-3xl text-base leading-6 text-gray-700">{recommendation.reason}</p>

          {recommendation.basis.length > 0 && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-white/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">추천 근거</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {recommendation.basis.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-xl border-2 border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm">
          {recommendation.focusArea === "feedback" ? "피드백 우선" : "1:1 우선"}
        </div>
      </div>

      <div className="relative mt-6 space-y-4">
        {byFeedback.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">피드백 스킬</p>
            <div className="flex flex-wrap gap-2">
              {byFeedback.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm"
                >
                  {getLearningContentLabel(id)}
                </span>
              ))}
            </div>
          </div>
        )}
        {byOneOnOne.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">1:1 미팅 가이드</p>
            <div className="flex flex-wrap gap-2">
              {byOneOnOne.map((id) => (
                <span
                  key={id}
                  className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm"
                >
                  {getLearningContentLabel(id)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-6 rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm">
        <p className="text-sm font-semibold text-indigo-800">{recommendation.actionGuideTitle}</p>
        <p className="mt-2 text-sm leading-6 text-gray-700">{recommendation.actionGuideSummary}</p>

        <div className="mt-4 space-y-4">
          {recommendation.actionItems.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-xl bg-indigo-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
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
