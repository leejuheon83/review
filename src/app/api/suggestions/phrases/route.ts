import { NextResponse } from "next/server";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import { ensureDbReady } from "@/lib/db";
import {
  generateSuggestedPhrases,
  SuggestedPhrasePermissionError,
  SuggestedPhraseValidationError,
} from "@/lib/ai-suggested-phrases.service";
import type { FeedbackType } from "@/lib/types";

type RequestBody = {
  employeeId: string;
  feedbackType: FeedbackType;
  tags?: string[];
  context?: string;
};

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const body = (await req.json()) as RequestBody;
  try {
    const result = await generateSuggestedPhrases({
      actor,
      employeeId: body.employeeId,
      feedbackType: body.feedbackType,
      tags: body.tags || [],
      context: body.context || "",
    });
    return NextResponse.json({ suggestions: result.suggestions });
  } catch (error) {
    if (error instanceof SuggestedPhrasePermissionError) {
      return forbidden(error.message);
    }
    if (error instanceof SuggestedPhraseValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "추천 문구 생성에 실패했습니다." }, { status: 500 });
  }
}
