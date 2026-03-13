import { NextResponse } from "next/server";
import { db, ensureDbReady, persistDbState } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { MeetingRecord, MeetingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();

  const params = new URL(req.url).searchParams;
  const managerId = params.get("managerId") || actor.id;
  const type = params.get("type") as MeetingType | undefined;

  if (actor.role === "MANAGER" && managerId !== actor.id) {
    return forbidden("본인 면담 기록만 조회할 수 있습니다.");
  }

  const meetings = Array.isArray(db.meetings) ? db.meetings : [];
  let items: typeof meetings;
  if (actor.role === "HR") {
    items =
      managerId === actor.id || !params.has("managerId")
        ? meetings
        : meetings.filter((m) => m.managerId === managerId);
  } else {
    items = meetings.filter((m) => m.managerId === managerId);
  }
  if (type) items = items.filter((m) => m.meetingType === type);
  items = [...items].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    await ensureDbReady();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DB 초기화 실패";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "MANAGER") return forbidden("팀장만 면담 기록을 작성할 수 있습니다.");

  let body: {
    managerId?: string;
    managerName?: string;
    employeeId?: string;
    employeeName?: string;
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

  if (body.managerId !== actor.id) {
    return forbidden("본인 이름으로만 면담 기록을 작성할 수 있습니다.");
  }
  if (!body.employeeId || !body.meetingType || !body.meetingDate || !body.discussionNotes?.trim()) {
    return NextResponse.json(
      { error: "팀원, 면담 유형, 면담일, 주요 논의 내용은 필수입니다." },
      { status: 400 },
    );
  }

  try {
    const now = new Date().toISOString();
    const id = `meeting_${Date.now()}`;
    const record: MeetingRecord = {
      id,
      managerId: body.managerId,
      managerName: body.managerName || actor.name,
      employeeId: body.employeeId,
      employeeName: body.employeeName || "",
      meetingType: body.meetingType,
      meetingDate: body.meetingDate,
      goalSummary: body.goalSummary || "",
      discussionNotes: body.discussionNotes.trim(),
      managerComment: body.managerComment || "",
      supportNeeded: body.supportNeeded || "",
      actionItems: body.actionItems || "",
      nextMeetingDate: body.nextMeetingDate || null,
      aiSummary: body.aiSummary || "",
      createdAt: now,
      updatedAt: now,
    };
    if (!Array.isArray(db.meetings)) db.meetings = [];
    db.meetings.unshift(record);
    await persistDbState();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "면담 기록 저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
