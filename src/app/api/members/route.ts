import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { getActorFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const params = new URL(req.url).searchParams;
  const q = (params.get("q") || "").toLowerCase();

  const employees =
    actor.role === "HR"
      ? db.employees
      : db.employees.filter((e) => e.managerId === actor.id);

  const filtered = employees.filter((e) =>
    q ? e.name.toLowerCase().includes(q) : true,
  );
  return NextResponse.json({ items: filtered });
}

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "MANAGER" && actor.role !== "HR") {
    return NextResponse.json({ error: "팀장 또는 관리자만 팀원을 생성할 수 있습니다." }, { status: 403 });
  }

  const body = (await req.json()) as { name: string; role?: string; teamId?: string; managerId?: string };
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }

  let teamId: string;
  let managerId: string;

  if (actor.role === "HR" && body.teamId && body.managerId) {
    const team = db.teams.find((t) => t.id === body.teamId);
    const manager = db.users.find((u) => u.id === body.managerId && u.role === "MANAGER");
    if (!team) return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });
    if (!manager) return NextResponse.json({ error: "팀장을 찾을 수 없습니다." }, { status: 404 });
    if (manager.teamId !== body.teamId) {
      return NextResponse.json({ error: "팀장이 해당 부서에 소속되어 있지 않습니다." }, { status: 400 });
    }
    teamId = body.teamId;
    managerId = body.managerId;
  } else if (actor.role === "MANAGER") {
    teamId = actor.teamId || "team_alpha";
    managerId = actor.id;
  } else {
    return NextResponse.json({ error: "관리자는 부서와 팀장을 지정해야 합니다." }, { status: 400 });
  }

  const newItem = {
    id: `emp_${Date.now()}`,
    name: body.name.trim(),
    role: body.role?.trim() || "미지정",
    teamId,
    managerId,
    active: true,
  };
  await mutateDbWithTransaction((state) => {
    const employees = Array.isArray(state.employees) ? state.employees : [];
    if (employees.some((e) => e.id === newItem.id)) return state;
    return { ...state, employees: [newItem, ...employees] };
  });
  return NextResponse.json({ item: newItem }, { status: 201 });
}
