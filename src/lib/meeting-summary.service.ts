const INSUFFICIENT_MESSAGE =
  "요약할 기록이 없습니다. 면담 내용(주요 논의 내용 등)을 먼저 입력해 주세요.";
const MAX_SUMMARY_LENGTH = 280;

export type MeetingContentInput = {
  goalSummary: string;
  discussionNotes: string;
  managerComment: string;
  supportNeeded: string;
  actionItems: string;
};

function clip(text: string, maxLen: number): string {
  const v = text.replace(/\s+/g, " ").trim();
  return v.length > maxLen ? `${v.slice(0, maxLen - 3)}...` : v;
}

function extractKeyPhrases(text: string, maxPerSection: number): string[] {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return [];
  const sentences = trimmed
    .split(/[.!?。]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, maxPerSection).map((s) => clip(s, 50));
}

export function generateMeetingSummary(input: MeetingContentInput): string {
  const goal = extractKeyPhrases(input.goalSummary, 2);
  const discussion = extractKeyPhrases(input.discussionNotes, 3);
  const comment = extractKeyPhrases(input.managerComment, 2);
  const support = extractKeyPhrases(input.supportNeeded, 1);
  const actions = extractKeyPhrases(input.actionItems, 2);

  const all = [...goal, ...discussion, ...comment, ...support, ...actions].filter(Boolean);
  if (all.length === 0) return INSUFFICIENT_MESSAGE;

  const summary = all.join(". ").replace(/\s+/g, " ").trim();
  return clip(summary, MAX_SUMMARY_LENGTH);
}
