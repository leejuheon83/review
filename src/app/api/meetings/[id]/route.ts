import { NextResponse } from "next/server";
import { db, ensureDbReady, mutateDbWithTransaction } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { MeetingRecord, MeetingType } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const { id } = await params;
  const meetings = Array.isArray(db.meetings) ? db.meetings : [];
  const meeting = meetings.find((m) => m.id === id);
  if (!meeting) return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
  if (actor.role === "MANAGER" && meeting.managerId !== actor.id) {
    return forbidden("본인 면담 기록만 조회할 수 있습니다.");
  }
  return NextResponse.json({ item: meeting });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "MANAGER") return forbidden("팀장만 면담 기록을 수정할 수 있습니다.");

  const { id } = await params;
  const meetings = Array.isArray(db.meetings) ? db.meetings : [];
  const existing = meetings.find((m) => m.id === id);
  if (!existing) return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
  if (existing.managerId !== actor.id) {
    return forbidden("본인 면담 기록만 수정할 수 있습니다.");
  }

  let body: {
    meetingType?: MeetingType;
    meetingDate?: string;
    goalSummary?: string;
    discussionNotes?: string;
    managerComment?: string;
    supportNeeded?: string;
    actionItems?: string;
    nextMeetingDate?: string | null;
    aiSummary?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (body.discussionNotes !== undefined && !body.discussionNotes.trim()) {
    return NextResponse.json({ error: "주요 논의 내용은 필수입니다." }, { status: 400 });
  }

  const now = new Date().toISOString();
  await mutateDbWithTransaction((state) => {
    const meetings = Array.isArray(state.meetings) ? [...state.meetings] : [];
    const idx = meetings.findIndex((m) => m.id === id);
    if (idx === -1) return state;
    const m = meetings[idx];
    if (body.meetingType !== undefined) m.meetingType = body.meetingType;
    if (body.meetingDate !== undefined) m.meetingDate = body.meetingDate;
    if (body.goalSummary !== undefined) m.goalSummary = body.goalSummary;
    if (body.discussionNotes !== undefined) m.discussionNotes = body.discussionNotes;
    if (body.managerComment !== undefined) m.managerComment = body.managerComment;
    if (body.supportNeeded !== undefined) m.supportNeeded = body.supportNeeded;
    if (body.actionItems !== undefined) m.actionItems = body.actionItems;
    if (body.nextMeetingDate !== undefined) m.nextMeetingDate = body.nextMeetingDate;
    if (body.aiSummary !== undefined) m.aiSummary = body.aiSummary;
    m.updatedAt = now;
    return { ...state, meetings };
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "MANAGER") return forbidden("팀장만 면담 기록을 삭제할 수 있습니다.");

  const { id } = await params;
  const meetings = Array.isArray(db.meetings) ? db.meetings : [];
  const idx = meetings.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
  const existing = meetings[idx];
  if (existing.managerId !== actor.id) {
    return forbidden("본인 면담 기록만 삭제할 수 있습니다.");
  }

  await mutateDbWithTransaction((state) => {
    const meetings = Array.isArray(state.meetings) ? state.meetings.filter((m) => m.id !== id) : [];
    return { ...state, meetings };
  });
  return NextResponse.json({ ok: true });
}
