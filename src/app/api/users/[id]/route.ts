import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 팀장을 수정할 수 있습니다.");

  const { id } = await params;
  const user = db.users.find((u) => u.id === id);
  if (!user) return NextResponse.json({ error: "팀장을 찾을 수 없습니다." }, { status: 404 });
  if (user.role !== "MANAGER") return NextResponse.json({ error: "팀장만 수정할 수 있습니다." }, { status: 400 });

  const body = (await req.json()) as { name?: string; teamId?: string };
  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
    }
    user.name = String(body.name).trim();
  }
  if (body.teamId !== undefined) {
    const team = db.teams.find((t) => t.id === body.teamId);
    if (!team) return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });
  }

  await mutateDbWithTransaction((state) => {
    const users = Array.isArray(state.users) ? [...state.users] : [];
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return state;
    const u = users[idx];
    if (body.name !== undefined) u.name = String(body.name).trim();
    if (body.teamId !== undefined) u.teamId = body.teamId;
    return { ...state, users };
  });
  const updated = db.users.find((u) => u.id === id);
  const { password: _p, ...safe } = updated ?? user;
  return NextResponse.json({ item: safe });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 팀장을 삭제할 수 있습니다.");

  const { id } = await params;
  if (id === "admin") return forbidden("관리자 계정은 삭제할 수 없습니다.");

  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "팀장을 찾을 수 없습니다." }, { status: 404 });

  const user = db.users[idx];
  if (user.role !== "MANAGER") return NextResponse.json({ error: "팀장만 삭제할 수 있습니다." }, { status: 400 });

  const hasEmployees = db.employees.some((e) => e.managerId === id);
  if (hasEmployees) {
    return NextResponse.json(
      { error: "해당 팀장에게 소속된 팀원이 있어 삭제할 수 없습니다. 먼저 팀원을 다른 팀장에게 배정하세요." },
      { status: 400 },
    );
  }

  await mutateDbWithTransaction((state) => {
    const users = Array.isArray(state.users) ? state.users.filter((u) => u.id !== id) : [];
    return { ...state, users };
  });
  return NextResponse.json({ ok: true });
}
