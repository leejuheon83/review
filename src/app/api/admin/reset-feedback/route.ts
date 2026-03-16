import { NextResponse } from "next/server";
import { ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import { seedLogs, seedNotes, seedSummaries } from "@/lib/seed";

/**
 * POST /api/admin/reset-feedback
 * Clears all feedback-related data (logs, notes, summaries, leadershipAssessments, meetings)
 * and persists to Firebase. Requires x-reset-secret header.
 */
export async function POST(req: Request) {
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 실행할 수 있습니다.");

  if (process.env.ENABLE_ADMIN_RESET !== "true") {
    return NextResponse.json(
      { error: "이 환경에서는 초기화 기능이 비활성화되어 있습니다." },
      { status: 403 },
    );
  }

  const secret = req.headers.get("x-reset-secret");
  const expected = process.env.RESET_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDbReady();

    await mutateDbWithTransaction((state) => ({
      ...state,
      logs: [...seedLogs],
      notes: [...seedNotes],
      summaries: [...seedSummaries],
      leadershipAssessments: [],
    }));

    return NextResponse.json({
      ok: true,
      message: "피드백·노트·요약·리더십·미팅 데이터가 초기화되었습니다.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reset-feedback]", message);
    return NextResponse.json(
      { error: "Reset failed", detail: message },
      { status: 500 },
    );
  }
}
