import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const { id } = await params;
  const employee = db.employees.find((e) => e.id === id);
  if (!employee) return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });

  if (actor.role === "MANAGER" && employee.managerId !== actor.id) {
    return forbidden();
  }

  return NextResponse.json({ item: employee });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const { id } = await params;
  const employee = db.employees.find((e) => e.id === id);
  if (!employee) return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });

  if (actor.role !== "MANAGER" || employee.managerId !== actor.id) {
    return forbidden("본인 팀원만 수정할 수 있습니다.");
  }

  const body = (await req.json()) as { active?: boolean };
  if (typeof body.active === "boolean") {
    employee.active = body.active;
    await persistDbState();
  }
  return NextResponse.json({ item: employee });
}
