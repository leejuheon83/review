import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
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
  if (actor.role !== "MANAGER") {
    return NextResponse.json({ error: "팀장만 생성할 수 있습니다." }, { status: 403 });
  }

  const body = (await req.json()) as { name: string; role?: string };
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }

  const teamId = actor.teamId || "team_alpha";
  const newItem = {
    id: `emp_${Date.now()}`,
    name: body.name.trim(),
    role: body.role?.trim() || "미지정",
    teamId,
    managerId: actor.id,
    active: true,
  };
  db.employees.unshift(newItem);
  await persistDbState();
  return NextResponse.json({ item: newItem }, { status: 201 });
}
