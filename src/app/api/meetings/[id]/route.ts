import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { MeetingType } from "@/lib/types";
import {
  deleteMeeting,
  getMeetingById,
  patchMeeting,
} from "@/lib/meetings-store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDbReady();
    const actor = getActorFromRequest(req);
    if (!actor) return unauthorized();

    const { id } = await params;
    const meeting = await getMeetingById(id);
    if (!meeting) return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
    if (actor.role === "MANAGER" && meeting.managerId !== actor.id) {
      return forbidden("본인 면담 기록만 조회할 수 있습니다.");
    }
    return NextResponse.json({ item: meeting });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "면담 기록 조회 실패";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDbReady();
    const actor = getActorFromRequest(req);
    if (!actor) return unauthorized();
    if (actor.role !== "MANAGER") return forbidden("팀장만 면담 기록을 수정할 수 있습니다.");

    const { id } = await params;
    const existing = await getMeetingById(id);
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
    const updated = await patchMeeting(id, {
      ...(body.meetingType !== undefined ? { meetingType: body.meetingType } : {}),
      ...(body.meetingDate !== undefined ? { meetingDate: body.meetingDate } : {}),
      ...(body.goalSummary !== undefined ? { goalSummary: body.goalSummary } : {}),
      ...(body.discussionNotes !== undefined ? { discussionNotes: body.discussionNotes } : {}),
      ...(body.managerComment !== undefined ? { managerComment: body.managerComment } : {}),
      ...(body.supportNeeded !== undefined ? { supportNeeded: body.supportNeeded } : {}),
      ...(body.actionItems !== undefined ? { actionItems: body.actionItems } : {}),
      ...(body.nextMeetingDate !== undefined ? { nextMeetingDate: body.nextMeetingDate } : {}),
      ...(body.aiSummary !== undefined ? { aiSummary: body.aiSummary } : {}),
      updatedAt: now,
    });
    if (!updated) {
      return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "면담 기록 수정 실패";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDbReady();
    const actor = getActorFromRequest(req);
    if (!actor) return unauthorized();
    if (actor.role !== "MANAGER") return forbidden("팀장만 면담 기록을 삭제할 수 있습니다.");

    const { id } = await params;
    const existing = await getMeetingById(id);
    if (!existing) return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
    if (existing.managerId !== actor.id) {
      return forbidden("본인 면담 기록만 삭제할 수 있습니다.");
    }

    const ok = await deleteMeeting(id);
    if (!ok) return NextResponse.json({ error: "면담 기록을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "면담 기록 삭제 실패";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
