import { NextResponse } from "next/server";
import { ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { seedLogs, seedNotes, seedSummaries } from "@/lib/seed";

/**
 * POST /api/admin/reset-feedback
 * Clears all feedback-related data (logs, notes, summaries, leadershipAssessments, meetings)
 * and persists to Firebase. Requires x-reset-secret header.
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-reset-secret");
  const expected = process.env.RESET_SECRET ?? "dev-reset";
  if (secret !== expected) {
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
      meetings: [],
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
