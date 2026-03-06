type DiagramCardProps = {
  type: "sbi" | "radical-candor" | "oneonone-flow" | "oneonone-questions";
};

export default function DiagramCard({ type }: DiagramCardProps) {
  if (type === "sbi") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-center gap-3 text-sm font-semibold text-gray-700">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">Situation</div>
          <span>→</span>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">Behavior</div>
          <span>→</span>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">Impact</div>
        </div>
      </div>
    );
  }

  if (type === "radical-candor") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-3 text-center text-xs font-medium text-gray-700">
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="font-semibold">Obnoxious Aggression</p>
            <p className="mt-1 text-gray-500">솔직하지만 배려 부족</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4">
            <p className="font-semibold">Radical Candor</p>
            <p className="mt-1 text-gray-500">배려 + 솔직함</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="font-semibold">Manipulative Insincerity</p>
            <p className="mt-1 text-gray-500">진심 없이 대함</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="font-semibold">Ruinous Empathy</p>
            <p className="mt-1 text-gray-500">배려하지만 말하지 않음</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "oneonone-flow") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-gray-700">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">Check-in</div>
          <span>→</span>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">업무 진행</div>
          <span>→</span>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">어려움</div>
          <span>→</span>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">성장</div>
          <span>→</span>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">피드백</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">대화를 여는 질문</p>
          <p className="mt-2 text-sm text-gray-600">요즘 가장 어려운 업무는 무엇인가요?</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">지원 질문</p>
          <p className="mt-2 text-sm text-gray-600">제가 도와주면 좋은 부분이 있을까요?</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">성장 질문</p>
          <p className="mt-2 text-sm text-gray-600">다음 단계 성장을 위해 필요한 건 뭘까요?</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">리더십 피드백 질문</p>
          <p className="mt-2 text-sm text-gray-600">제가 팀장으로서 더 잘할 수 있는 점은 뭘까요?</p>
        </div>
      </div>
    </div>
  );
}
