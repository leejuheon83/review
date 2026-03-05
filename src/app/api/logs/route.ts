import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { FeedbackType } from "@/lib/types";

function inPeriod(createdAt: string, period: string): boolean {
  if (period === "all") return true;
  const now = Date.now();
  const ts = new Date(createdAt).getTime();
  const days = period === "30" ? 30 : period === "90" ? 90 : 30;
  return now - ts <= days * 24 * 60 * 60 * 1000;
}

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const params = new URL(req.url).searchParams;
  const employeeId = params.get("employeeId");
  const managerId = params.get("managerId");
  const type = params.get("type");
  const tag = params.get("tag");
  const q = (params.get("q") || "").toLowerCase();
  const period = params.get("period") || "30";
  const sort = params.get("sort") || "latest";

  let logs = db.logs.slice();

  if (actor.role === "MANAGER") {
    const employeeIds = db.employees
      .filter((e) => e.managerId === actor.id)
      .map((e) => e.id);
    logs = logs.filter((l) => employeeIds.includes(l.employeeId));
  }

  if (employeeId) logs = logs.filter((l) => l.employeeId === employeeId);
  if (managerId) logs = logs.filter((l) => l.managerId === managerId);
  if (type && type !== "all") logs = logs.filter((l) => l.type === type);
  if (tag && tag !== "all") logs = logs.filter((l) => l.tags.includes(tag));
  if (q) logs = logs.filter((l) => l.memo.toLowerCase().includes(q));
  logs = logs.filter((l) => inPeriod(l.createdAt, period));

  logs.sort((a, b) => {
    if (sort === "pinned") {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ items: logs });
}

export async function POST(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "MANAGER") return forbidden("팀장만 기록할 수 있습니다.");

  const body = (await req.json()) as {
    employeeId: string;
    type: FeedbackType;
    memo: string;
    tags?: string[];
    pinned?: boolean;
  };

  if (!body.employeeId || !body.type || !body.memo?.trim()) {
    return NextResponse.json({ error: "필수값이 누락되었습니다." }, { status: 400 });
  }
  if (body.memo.trim().length < 5 || body.memo.trim().length > 200) {
    return NextResponse.json({ error: "메모는 5~200자여야 합니다." }, { status: 400 });
  }

  const employee = db.employees.find((e) => e.id === body.employeeId);
  if (!employee) return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });
  if (employee.managerId !== actor.id) return forbidden("본인 팀원만 기록할 수 있습니다.");

  const now = new Date().toISOString();
  const item = {
    id: `log_${Date.now()}`,
    employeeId: body.employeeId,
    managerId: actor.id,
    type: body.type,
    memo: body.memo.trim(),
    tags: (body.tags || []).slice(0, 6),
    pinned: Boolean(body.pinned),
    createdAt: now,
    updatedAt: now,
  };
  db.logs.unshift(item);
  await persistDbState();
  return NextResponse.json({ item }, { status: 201 });
}
