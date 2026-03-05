import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { FeedbackType } from "@/lib/types";

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

  if (body.memo !== undefined) {
    const memo = body.memo.trim();
    if (memo.length < 5 || memo.length > 200) {
      return NextResponse.json({ error: "메모는 5~200자여야 합니다." }, { status: 400 });
    }
    item.memo = memo;
  }
  if (body.type) item.type = body.type;
  if (body.tags) item.tags = body.tags.slice(0, 6);
  if (typeof body.pinned === "boolean") item.pinned = body.pinned;
  item.updatedAt = new Date().toISOString();
  await persistDbState();

  return NextResponse.json({ item });
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

  db.logs.splice(idx, 1);
  await persistDbState();
  return NextResponse.json({ ok: true });
}
