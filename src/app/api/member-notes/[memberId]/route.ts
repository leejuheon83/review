import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const { memberId } = await params;

  const employee = db.employees.find((e) => e.id === memberId);
  if (!employee) return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });
  if (actor.role === "MANAGER" && employee.managerId !== actor.id) return forbidden();

  const note = db.notes.find((n) => n.memberId === memberId) || null;
  return NextResponse.json({ item: note });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const { memberId } = await params;
  if (actor.role !== "MANAGER") return forbidden("팀장만 수정할 수 있습니다.");

  const employee = db.employees.find((e) => e.id === memberId);
  if (!employee) return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });
  if (employee.managerId !== actor.id) return forbidden();

  const body = (await req.json()) as { nextAction: string };
  const nextAction = (body.nextAction || "").trim();
  const now = new Date().toISOString();

  const existing = db.notes.find((n) => n.memberId === memberId && n.ownerUid === actor.id);
  if (existing) {
    existing.nextAction = nextAction;
    existing.updatedAt = now;
    await persistDbState();
    return NextResponse.json({ item: existing });
  }

  const item = {
    id: `note_${Date.now()}`,
    ownerUid: actor.id,
    memberId,
    nextAction,
    updatedAt: now,
  };
  db.notes.unshift(item);
  await persistDbState();
  return NextResponse.json({ item });
}
