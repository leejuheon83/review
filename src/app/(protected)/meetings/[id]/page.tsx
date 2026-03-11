"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useActor } from "@/components/actor-provider";
import { getMeetingById, deleteMeeting, formatMeetingDate } from "@/lib/meetings";
import type { Meeting } from "@/types/meeting";
import { MEETING_TYPE_LABELS } from "@/types/meeting";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-500">{title}</h3>
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap">
        {children || "-"}
      </div>
    </div>
  );
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { actor } = useActor();
  const id = params.id as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const msg = typeof window !== "undefined" ? sessionStorage.getItem("meeting-toast") : null;
    if (msg) {
      sessionStorage.removeItem("meeting-toast");
      setToast(msg);
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    getMeetingById(id)
      .then(setMeeting)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("이 면담 기록을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      await deleteMeeting(id);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("meeting-toast", "면담 기록이 삭제되었습니다.");
      }
      router.push("/meetings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  const meetingDate = meeting?.meetingDate
    ? "toDate" in meeting.meetingDate
      ? meeting.meetingDate.toDate()
      : new Date(meeting.meetingDate as unknown as string)
    : null;
  const nextDate = meeting?.nextMeetingDate
    ? "toDate" in meeting.nextMeetingDate
      ? meeting.nextMeetingDate.toDate()
      : new Date(meeting.nextMeetingDate as unknown as string)
    : null;

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-slate-500">
        불러오는 중...
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error || "면담 기록을 찾을 수 없습니다."}
        <Link href="/meetings" className="mt-4 block text-sm font-medium underline">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {toast && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {toast}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">면담 상세</h1>
        <div className="flex gap-2">
          <Link
            href={`/meetings/${id}/edit`}
            className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0059A8]"
          >
            수정
          </Link>
          <Link
            href="/meetings"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            목록으로
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-4">
          <Section title="기본 정보">
            <div className="space-y-1">
              <p><span className="font-medium">팀원:</span> {meeting.employeeName}</p>
              <p><span className="font-medium">면담 유형:</span> {MEETING_TYPE_LABELS[meeting.meetingType]}</p>
              <p><span className="font-medium">면담일:</span> {meetingDate ? formatMeetingDate(meetingDate) : "-"}</p>
              {nextDate && (
                <p><span className="font-medium">다음 면담 예정일:</span> {formatMeetingDate(nextDate)}</p>
              )}
            </div>
          </Section>

          <Section title="외부 목표 요약">{meeting.goalSummary}</Section>
          <Section title="주요 논의 내용">{meeting.discussionNotes}</Section>
          <Section title="팀장 코멘트">{meeting.managerComment}</Section>
          <Section title="지원 필요 사항">{meeting.supportNeeded}</Section>
          <Section title="합의된 액션">{meeting.actionItems}</Section>

          {meeting.aiSummary && (
            <Section title="AI 요약">{meeting.aiSummary}</Section>
          )}
        </div>

        <div className="border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-rose-600 hover:underline disabled:opacity-60"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
