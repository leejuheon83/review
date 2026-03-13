import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 팀장 목록을 조회할 수 있습니다.");

  const managers = db.users.filter((u) => u.role === "MANAGER");
  const safe = managers.map((u) => {
    const { password, ...rest } = u;
    return rest;
  });
  return NextResponse.json({ items: safe });
}

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("관리자만 팀장을 추가할 수 있습니다.");

  const body = (await req.json()) as { name?: string; teamId?: string; employeeNo?: string };
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }
  if (!body?.teamId?.trim()) {
    return NextResponse.json({ error: "부서는 필수입니다." }, { status: 400 });
  }
  if (!body?.employeeNo?.trim()) {
    return NextResponse.json({ error: "사번은 필수입니다." }, { status: 400 });
  }

  const team = db.teams.find((t) => t.id === body.teamId);
  if (!team) return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });

  const employeeNo = body.employeeNo.trim();
  const id = `mgr_${employeeNo}`;
  if (db.users.some((u) => u.id === id)) {
    return NextResponse.json({ error: "이미 존재하는 사번입니다." }, { status: 400 });
  }

  const newUser: User = {
    id,
    name: body.name.trim(),
    role: "MANAGER",
    teamId: body.teamId,
    password: employeeNo,
  };
  await mutateDbWithTransaction((state) => {
    const users = Array.isArray(state.users) ? state.users : [];
    if (users.some((u) => u.id === newUser.id)) return state;
    return { ...state, users: [newUser, ...users] };
  });

  const { password: _p, ...safe } = newUser;
  return NextResponse.json({ item: safe }, { status: 201 });
}
