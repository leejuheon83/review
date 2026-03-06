import type { FeedbackType } from "@/lib/types";

type QuickLogInput = {
  employeeId: string;
  type: FeedbackType | "";
  memo: string;
};

export function validateQuickLogInput(input: QuickLogInput): string | null {
  if (!input.employeeId) return "팀원을 선택해 주세요.";
  if (!input.type) return "피드백 유형을 선택해 주세요.";
  const memoLength = input.memo.trim().length;
  if (memoLength < 5 || memoLength > 200) return "메모는 5~200자로 입력해 주세요.";
  return null;
}
