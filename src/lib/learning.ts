export type LearningCategory = "feedback" | "oneonone";

export type LearningContent = {
  id: string;
  category: LearningCategory;
  title: string;
  subtitle: string;
  theory: string[];
  bullets: string[];
  exampleGood?: string;
  exampleBad?: string;
  diagramType: "sbi" | "radical-candor" | "oneonone-flow" | "oneonone-questions";
  tags: string[];
  /** 원문/참고 자료 URL */
  sourceUrl?: string;
  /** 출처 표시 라벨 (예: "Center for Creative Leadership") */
  sourceLabel?: string;
};

export const learningContents: LearningContent[] = [
  {
    id: "sbi-feedback",
    category: "feedback",
    title: "SBI 피드백 모델",
    subtitle: "Situation → Behavior → Impact 구조로 구체적으로 말하기",
    theory: [
      "SBI는 가장 널리 쓰이는 피드백 구조 중 하나예요.",
      "사람 자체를 평가하지 않고, 특정 상황에서의 행동과 그 영향에 집중하게 도와줘요.",
      "칭찬과 개선 피드백 모두에 사용할 수 있어요.",
    ],
    bullets: [
      "Situation: 언제, 어떤 상황이었는지 말하기",
      "Behavior: 어떤 행동이 있었는지 관찰 중심으로 말하기",
      "Impact: 그 행동이 어떤 결과를 만들었는지 설명하기",
    ],
    exampleBad: "요즘 발표가 좀 아쉬워요.",
    exampleGood: "오늘 고객 미팅에서 발표 초반에 결론을 먼저 말해줘서, 논의가 빠르게 정리됐어요.",
    diagramType: "sbi",
    tags: ["피드백", "SBI", "칭찬", "개선"],
    sourceUrl: "https://www.ccl.org/articles/leading-effectively-articles/sbi-feedback-model-a-quick-win-to-improve-talent-conversations-development/",
    sourceLabel: "Center for Creative Leadership - SBI Feedback Model",
  },
  {
    id: "radical-candor",
    category: "feedback",
    title: "Radical Candor",
    subtitle: "배려와 솔직함을 같이 가져가는 피드백 방식",
    theory: [
      "좋은 피드백은 따뜻하기만 하거나, 날카롭기만 해서는 부족해요.",
      "상대에 대한 진심 어린 관심(Care Personally)과 직접적인 솔직함(Challenge Directly)이 같이 가야 해요.",
      "팀장에게 특히 중요한 건, 피드백을 피하지 않으면서도 관계를 잃지 않는 거예요.",
    ],
    bullets: [
      "배려만 있고 솔직함이 없으면 말해야 할 개선점을 놓치기 쉬워요.",
      "솔직함만 있고 배려가 없으면 방어적인 반응을 만들 수 있어요.",
      "좋은 리더 피드백은 존중 + 명확함이에요.",
    ],
    exampleBad: "이거 왜 이렇게 했어요? 너무 별로예요.",
    exampleGood:
      "이번 문서는 정리가 빨라서 좋았어요. 다만 핵심 메시지가 뒤에 나와서, 다음엔 결론을 먼저 두면 더 설득력 있을 것 같아요.",
    diagramType: "radical-candor",
    tags: ["피드백", "Radical Candor", "코칭", "관계"],
    sourceUrl: "https://www.radicalcandor.com/",
    sourceLabel: "Radical Candor - Kim Scott",
  },
  {
    id: "positive-feedback",
    category: "feedback",
    title: "좋은 칭찬 피드백",
    subtitle: "추상적인 칭찬 대신 행동 기반으로 말하기",
    theory: [
      "칭찬은 동기부여를 높이지만, 너무 추상적이면 금방 흩어져요.",
      "좋은 칭찬은 '무엇이 좋았는지'와 '왜 좋았는지'가 같이 들어가야 해요.",
      "팀원이 반복하면 좋은 행동을 정확히 알게 만드는 것이 핵심이에요.",
    ],
    bullets: [
      "좋았던 행동을 구체적으로 짚기",
      "그 행동이 팀/업무에 준 긍정적 영향을 설명하기",
      "다음에도 이어가면 좋겠다는 기대를 말하기",
    ],
    exampleBad: "오늘 잘했어요.",
    exampleGood:
      "오늘 회의에서 고객 질문을 먼저 정리해줘서 논의가 훨씬 빨리 끝났어요. 다음에도 그 방식으로 진행하면 좋겠어요.",
    diagramType: "sbi",
    tags: ["칭찬", "인정", "동기부여"],
    sourceUrl: "https://www.ccl.org/articles/leading-effectively-articles/review-time-how-to-give-different-types-of-feedback/",
    sourceLabel: "CCL - How to Give Feedback Most Effectively",
  },
  {
    id: "oneonone-flow",
    category: "oneonone",
    title: "1:1 미팅 기본 구조",
    subtitle: "체크인 → 업무 → 어려움 → 성장 → 피드백",
    theory: [
      "좋은 1:1은 단순한 업무 보고 시간이 아니에요.",
      "상태 확인, 실행 점검, 막힌 점, 성장, 관계를 함께 다루는 시간이 되어야 해요.",
      "루틴이 있으면 미팅 품질이 흔들리지 않아요.",
    ],
    bullets: [
      "Check-in: 요즘 상태와 에너지 확인",
      "업무 진행: 현재 우선순위와 진행 상황 점검",
      "어려움: 막히는 점이나 지원이 필요한 부분 확인",
      "성장: 배우고 싶은 것, 다음 단계 이야기",
      "피드백: 팀과 팀장에 대한 의견 듣기",
    ],
    exampleGood:
      "요즘 가장 에너지 많이 쓰는 일은 뭐예요? 지금 가장 막히는 부분이 있나요? 제가 도와줄 수 있는 건 뭐가 있을까요?",
    diagramType: "oneonone-flow",
    tags: ["1:1", "미팅", "체크인", "성장"],
    sourceUrl: "https://rework.withgoogle.com/intl/en/guides/managers-coach-managers-to-coach/",
    sourceLabel: "Google re:Work - Coach managers to coach",
  },
  {
    id: "oneonone-questions",
    category: "oneonone",
    title: "좋은 1:1 질문 예시",
    subtitle: "대화를 여는 질문, 막힘을 푸는 질문, 성장 질문",
    theory: [
      "좋은 1:1 질문은 답을 유도하지 않고, 생각을 꺼내게 해줘요.",
      "열린 질문이 많을수록 팀원의 실제 상태를 더 잘 알 수 있어요.",
      "질문은 '보고 받기'보다 '이해하기'에 가까워야 해요.",
    ],
    bullets: [
      "최근 가장 어려운 업무는 무엇인가요?",
      "지금 가장 우선순위가 높은 일은 무엇인가요?",
      "제가 팀장으로서 더 도와주면 좋은 부분이 있나요?",
      "최근에 가장 뿌듯했던 순간은 언제였나요?",
      "다음 단계 성장을 위해 필요한 기회는 무엇인가요?",
    ],
    exampleGood:
      "최근 가장 에너지가 많이 드는 일이 뭐예요? 제가 조정해주면 좋은 부분이 있을까요?",
    diagramType: "oneonone-questions",
    tags: ["1:1", "질문", "경청", "성장"],
    sourceUrl: "https://rework.withgoogle.com/intl/en/guides/managers-coach-managers-to-coach/",
    sourceLabel: "Google re:Work - Coach managers to coach (1:1 tips)",
  },
];

export function getLearningContentsByCategory(category: LearningCategory): LearningContent[] {
  return learningContents.filter((item) => item.category === category);
}

export function getLearningContentLabel(id: string) {
  const labelMap: Record<string, string> = {
    "radical-candor": "Radical Candor",
    "sbi-feedback": "SBI 피드백",
    "positive-feedback": "좋은 칭찬 피드백",
    "oneonone-flow": "1:1 미팅 구조",
    "oneonone-questions": "1:1 질문 가이드",
  };

  return labelMap[id] ?? id;
}
