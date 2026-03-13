import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import { buildMemberProfilePatch } from "@/lib/member-profile";

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

  if (actor.role !== "HR" && (actor.role !== "MANAGER" || employee.managerId !== actor.id)) {
    return forbidden("본인 팀원만 수정할 수 있습니다.");
  }

  const body = (await req.json()) as {
    active?: boolean;
    name?: string;
    role?: string;
    teamId?: string;
    managerId?: string;
  };

  const hasProfileField =
    Object.prototype.hasOwnProperty.call(body, "name") ||
    Object.prototype.hasOwnProperty.call(body, "role");
  const patch = hasProfileField ? buildMemberProfilePatch({ name: body.name, role: body.role }) : null;
  if (patch?.error) {
    return NextResponse.json({ error: patch.error }, { status: 400 });
  }

  if (actor.role === "HR" && body.teamId && body.managerId) {
    const team = db.teams.find((t) => t.id === body.teamId);
    const manager = db.users.find((u) => u.id === body.managerId && u.role === "MANAGER");
    if (!team) return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });
    if (!manager) return NextResponse.json({ error: "팀장을 찾을 수 없습니다." }, { status: 404 });
    if (manager.teamId !== body.teamId) {
      return NextResponse.json({ error: "팀장이 해당 부서에 소속되어 있지 않습니다." }, { status: 400 });
    }
  }

  await mutateDbWithTransaction((state) => {
    const employees = Array.isArray(state.employees) ? [...state.employees] : [];
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) return state;
    const e = employees[idx];
    let changed = false;
    if (typeof body.active === "boolean") {
      e.active = body.active;
      changed = true;
    }
    if (actor.role === "HR" && body.teamId && body.managerId) {
      e.teamId = body.teamId;
      e.managerId = body.managerId;
      changed = true;
    }
    if (patch?.updates.name) {
      e.name = patch.updates.name;
      changed = true;
    }
    if (patch?.updates.role) {
      e.role = patch.updates.role;
      changed = true;
    }
    return changed ? { ...state, employees } : state;
  });

  const updated = db.employees.find((e) => e.id === id);
  return NextResponse.json({ item: updated ?? employee });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const { id } = await params;

  const employee = db.employees.find((e) => e.id === id);
  if (!employee) return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });

  if (actor.role !== "HR" && (actor.role !== "MANAGER" || employee.managerId !== actor.id)) {
    return forbidden("본인 팀원만 삭제할 수 있습니다.");
  }

  await mutateDbWithTransaction((state) => {
    const employees = Array.isArray(state.employees) ? state.employees.filter((e) => e.id !== id) : [];
    return { ...state, employees };
  });
  return NextResponse.json({ ok: true });
}
