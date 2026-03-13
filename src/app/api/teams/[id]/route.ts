import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { Team } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 부서를 수정할 수 있습니다.");

  const { id } = await params;
  const body = (await req.json()) as { name?: string };
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "부서명은 필수입니다." }, { status: 400 });
  }

  const team = db.teams.find((t) => t.id === id);
  if (!team) return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });

  team.name = body.name.trim();
  await persistDbState();
  return NextResponse.json({ item: team });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 부서를 삭제할 수 있습니다.");

  const { id } = await params;
  const idx = db.teams.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });

  const hasUsers = db.users.some((u) => u.teamId === id);
  const hasEmployees = db.employees.some((e) => e.teamId === id);
  if (hasUsers || hasEmployees) {
    return NextResponse.json(
      { error: "해당 부서에 소속된 팀장 또는 팀원이 있어 삭제할 수 없습니다." },
      { status: 400 },
    );
  }

  db.teams.splice(idx, 1);
  await persistDbState();
  return NextResponse.json({ ok: true });
}
