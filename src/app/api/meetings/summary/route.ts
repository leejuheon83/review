import { NextResponse } from "next/server";
import { getActorFromRequest, unauthorized } from "@/lib/auth";
import { generateMeetingSummary } from "@/lib/meeting-summary.service";

type RequestBody = {
  goalSummary?: string;
  discussionNotes?: string;
  managerComment?: string;
  supportNeeded?: string;
  actionItems?: string;
};

export async function POST(req: Request) {
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const summary = generateMeetingSummary({
    goalSummary: body.goalSummary ?? "",
    discussionNotes: body.discussionNotes ?? "",
    managerComment: body.managerComment ?? "",
    supportNeeded: body.supportNeeded ?? "",
    actionItems: body.actionItems ?? "",
  });

  return NextResponse.json({ summary });
}
