import DiagramCard from "@/components/learning/diagram-card";
import type { LearningContent } from "@/lib/learning-content";

type TheoryCardProps = {
  content: LearningContent;
};

export default function TheoryCard({ content }: TheoryCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {content.category === "feedback" ? "피드백 스킬" : "1:1 미팅 가이드"}
        </p>
        <h3 className="mt-2 text-xl font-bold text-gray-900">{content.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{content.subtitle}</p>
      </div>

      <div className="mb-5">
        <DiagramCard type={content.diagramType} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">핵심 이론</h4>
          <div className="space-y-2">
            {content.theory.map((item, index) => (
              <p key={index} className="text-sm leading-6 text-gray-700">
                {item}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">실전 포인트</h4>
          <ul className="space-y-2">
            {content.bullets.map((item, index) => (
              <li key={index} className="text-sm leading-6 text-gray-700">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {content.exampleBad || content.exampleGood ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {content.exampleBad ? (
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-xs font-semibold text-rose-700">아쉬운 예시</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{content.exampleBad}</p>
            </div>
          ) : null}

          {content.exampleGood ? (
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-semibold text-green-700">좋은 예시</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{content.exampleGood}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
