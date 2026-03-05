import { NextResponse } from "next/server";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import { ensureDbReady } from "@/lib/db";
import {
  generateEmployeeSummary,
  SummaryPermissionError,
  SummaryValidationError,
} from "@/lib/ai-summary.service";
import type { FeedbackType } from "@/lib/types";

type RequestBody = {
  employeeId: string;
  startDate: string;
  endDate: string;
  type?: FeedbackType | "all";
  tags?: string[];
  regenerate?: boolean;
};

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const body = (await req.json()) as RequestBody;

  try {
    const result = await generateEmployeeSummary({
      actor,
      employeeId: body.employeeId,
      filters: {
        startDate: body.startDate,
        endDate: body.endDate,
        type: body.type || "all",
        tags: body.tags || [],
      },
      regenerate: Boolean(body.regenerate),
    });
    return NextResponse.json({
      item: result.summary,
      status: result.status,
      usedLogIds: result.usedLogs.map((log) => log.id),
      usedLogsCount: result.usedLogs.length,
      prompt: result.prompt,
    });
  } catch (error) {
    if (error instanceof SummaryPermissionError) {
      return forbidden(error.message);
    }
    if (error instanceof SummaryValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "요약 생성에 실패했습니다." }, { status: 500 });
  }
}
