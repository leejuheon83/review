import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";
import type { MeetingRecord, MeetingType } from "@/lib/types";
import { createMeeting, listMeetings } from "@/lib/meetings-store";

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

  try {
    let items: MeetingRecord[];
    if (actor.role === "HR") {
      items =
        managerId === actor.id || !params.has("managerId")
          ? await listMeetings({ type })
          : await listMeetings({ managerId, type });
    } else {
      items = await listMeetings({ managerId, type });
    }
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "면담 목록 조회 실패";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
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
  if (actor.role !== "MANAGER" && actor.role !== "HR") {
    return forbidden("팀장 또는 HR만 면담 기록을 작성할 수 있습니다.");
  }

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

  if (actor.role === "MANAGER" && body.managerId !== actor.id) {
    return forbidden("본인 이름으로만 면담 기록을 작성할 수 있습니다.");
  }
  if (!body.managerId) {
    return NextResponse.json({ error: "팀장 정보가 필요합니다." }, { status: 400 });
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
    await createMeeting(record);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "면담 기록 저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
