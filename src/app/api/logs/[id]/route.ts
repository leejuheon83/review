import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { FeedbackType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const { id } = await params;
  const item = db.logs.find((l) => l.id === id);
  if (!item) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });

  if (actor.role !== "MANAGER" || item.managerId !== actor.id) {
    return forbidden("본인 작성 기록만 수정할 수 있습니다.");
  }

  const body = (await req.json()) as {
    type?: FeedbackType;
    memo?: string;
    tags?: string[];
    pinned?: boolean;
  };

  const now = new Date().toISOString();
  const memo = body.memo !== undefined ? body.memo.trim() : item.memo;
  if (memo.length < 5 || memo.length > 200) {
    return NextResponse.json({ error: "메모는 5~200자여야 합니다." }, { status: 400 });
  }

  await mutateDbWithTransaction((state) => {
    const logs = Array.isArray(state.logs) ? [...state.logs] : [];
    const idx = logs.findIndex((l) => l.id === id);
    if (idx === -1) return state;
    logs[idx] = {
      ...logs[idx],
      memo,
      type: body.type ?? logs[idx].type,
      tags: body.tags ? body.tags.slice(0, 6) : logs[idx].tags,
      pinned: typeof body.pinned === "boolean" ? body.pinned : logs[idx].pinned,
      updatedAt: now,
    };
    return { ...state, logs };
  });

  const updated = db.logs.find((l) => l.id === id);
  return NextResponse.json({ item: updated ?? item });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  const { id } = await params;
  const idx = db.logs.findIndex((l) => l.id === id);
  if (idx < 0) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });

  const item = db.logs[idx];
  if (actor.role !== "MANAGER" || item.managerId !== actor.id) {
    return forbidden("본인 작성 기록만 삭제할 수 있습니다.");
  }

  await mutateDbWithTransaction((state) => {
    const logs = Array.isArray(state.logs) ? state.logs.filter((l) => l.id !== id) : [];
    return { ...state, logs };
  });
  return NextResponse.json({ ok: true });
}
