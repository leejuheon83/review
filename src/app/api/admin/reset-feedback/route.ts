import { NextResponse } from "next/server";
import { ensureDbReady, persistDbState, db } from "@/lib/db";
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

  await ensureDbReady();

  db.logs = [...seedLogs];
  db.notes = [...seedNotes];
  db.summaries = [...seedSummaries];
  db.leadershipAssessments = [];
  db.meetings = [];

  await persistDbState();

  return NextResponse.json({
    ok: true,
    message: "피드백·노트·요약·리더십·미팅 데이터가 초기화되었습니다.",
  });
}
