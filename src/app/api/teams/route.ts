import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { Team } from "@/lib/types";

export async function GET() {
  await ensureDbReady();
  return NextResponse.json({ items: db.teams });
}

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 부서를 추가할 수 있습니다.");

  const body = (await req.json()) as { name?: string };
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "부서명은 필수입니다." }, { status: 400 });
  }

  const id = `team_${Date.now()}`;
  const newTeam: Team = { id, name: body.name.trim() };
  db.teams.push(newTeam);
  await persistDbState();
  return NextResponse.json({ item: newTeam }, { status: 201 });
}

