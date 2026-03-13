import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
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
  await mutateDbWithTransaction((state) => {
    const notes = Array.isArray(state.notes) ? [...state.notes] : [];
    const idx = notes.findIndex((n) => n.memberId === memberId && n.ownerUid === actor.id);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], nextAction, updatedAt: now };
    } else {
      notes.unshift({
        id: `note_${Date.now()}`,
        ownerUid: actor.id,
        memberId,
        nextAction,
        updatedAt: now,
      });
    }
    return { ...state, notes };
  });

  const saved = db.notes.find((n) => n.memberId === memberId && n.ownerUid === actor.id);
  return NextResponse.json({ item: saved! });
}
