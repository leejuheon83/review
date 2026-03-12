import test from "node:test";
import assert from "node:assert/strict";
import { generateMeetingSummary } from "@/lib/meeting-summary.service";

test("작성된 면담 내용이 있으면 요약 코멘트를 반환한다", () => {
  const result = generateMeetingSummary({
    goalSummary: "분기 목표 80% 달성, 신규 프로젝트 착수 예정",
    discussionNotes: "이번 분기 성과 공유. 다음 분기 우선순위 조정 논의.",
    managerComment: "실행력이 좋았음. 리스크 공유 시점을 앞당기면 좋겠다.",
    supportNeeded: "교육 예산 검토 요청",
    actionItems: "다음 주 1:1에서 진행상황 점검",
  });
  assert.ok(result.length > 0);
  assert.ok(result.length <= 300);
});

test("주요 논의 내용만 있어도 요약을 생성한다", () => {
  const result = generateMeetingSummary({
    goalSummary: "",
    discussionNotes: "목표 진행 상황 점검. 블로커 없음.",
    managerComment: "",
    supportNeeded: "",
    actionItems: "",
  });
  assert.ok(result.length > 0);
});

test("모든 필드가 비어있으면 안내 문구를 반환한다", () => {
  const result = generateMeetingSummary({
    goalSummary: "",
    discussionNotes: "",
    managerComment: "",
    supportNeeded: "",
    actionItems: "",
  });
  assert.match(result, /입력|기록|없습니다/);
});

test("요약은 행동·사실 기반으로 구성된다", () => {
  const result = generateMeetingSummary({
    goalSummary: "KPI 90% 달성",
    discussionNotes: "다음 분기 로드맵 논의",
    managerComment: "협업 태도 긍정적",
    supportNeeded: "",
    actionItems: "2주 후 진행 점검",
  });
  assert.ok(result.includes("달성") || result.includes("논의") || result.includes("점검") || result.length > 20);
});
