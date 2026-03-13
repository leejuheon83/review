import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const params = new URL(req.url).searchParams;
  const ownerUid = params.get("ownerUid") || "";

  if (!ownerUid) {
    return NextResponse.json({ error: "ownerUid가 필요합니다." }, { status: 400 });
  }
  if (actor.role !== "HR" && actor.id !== ownerUid) {
    return forbidden("본인 진단 기록만 조회할 수 있습니다.");
  }

  const source = Array.isArray(db.leadershipAssessments) ? db.leadershipAssessments : [];
  const items = source
    .filter((item) => item.ownerUid === ownerUid)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "MANAGER" && actor.role !== "HR") {
    return forbidden("권한이 없습니다.");
  }

  const body = (await req.json()) as {
    ownerUid: string;
    monthKey: string;
    scores: Record<string, number>;
    totalScore: number;
    memo: string;
  };

  if (!body.ownerUid || !body.monthKey || !body.scores || typeof body.totalScore !== "number") {
    return NextResponse.json({ error: "필수값이 누락되었습니다." }, { status: 400 });
  }
  if (actor.role !== "HR" && actor.id !== body.ownerUid) {
    return forbidden("본인 진단 기록만 저장할 수 있습니다.");
  }

  const item = {
    id: `leader_${Date.now()}`,
    ownerUid: body.ownerUid,
    monthKey: body.monthKey,
    scores: body.scores,
    totalScore: body.totalScore,
    memo: (body.memo || "").trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  await mutateDbWithTransaction((state) => {
    const assessments = Array.isArray(state.leadershipAssessments) ? state.leadershipAssessments : [];
    if (assessments.some((a) => a.id === item.id)) return state;
    return { ...state, leadershipAssessments: [item, ...assessments] };
  });

  return NextResponse.json({ item }, { status: 201 });
}
