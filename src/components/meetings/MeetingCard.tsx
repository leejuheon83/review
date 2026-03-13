"use client";

import { useState } from "react";
import Link from "next/link";
import type { Meeting, MeetingType } from "@/types/meeting";
import { MEETING_TYPE_LABELS } from "@/types/meeting";
import { formatMeetingDate } from "@/lib/meetings";

type MeetingCardProps = {
  meeting: Meeting;
  onDelete?: (id: string) => Promise<void>;
};

const TYPE_BADGE: Record<MeetingType, string> = {
  goal: "bg-amber-100 text-amber-800",
  quarterly: "bg-blue-100 text-blue-800",
  coaching: "bg-emerald-100 text-emerald-800",
  general: "bg-slate-100 text-slate-700",
};

export function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  const [deleting, setDeleting] = useState(false);
  const meetingDate = "toDate" in meeting.meetingDate ? meeting.meetingDate.toDate() : new Date(meeting.meetingDate as unknown as string);
  const summary = meeting.discussionNotes?.slice(0, 80) || meeting.aiSummary?.slice(0, 80) || "-";
  const hasAction = Boolean(meeting.actionItems?.trim());
  const hasNext = Boolean(meeting.nextMeetingDate);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(meeting.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{meeting.employeeName}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[meeting.meetingType]}`}>
              {MEETING_TYPE_LABELS[meeting.meetingType]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{formatMeetingDate(meetingDate)}</p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {summary}
            {summary !== "-" && summary.length >= 80 ? "…" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasNext && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">다음 면담 예정</span>
          )}
          {hasAction && (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">액션 있음</span>
          )}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/meetings/${meeting.id}/edit`}
              className="rounded px-2 py-1 text-xs font-medium text-[#0070C9] hover:bg-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              수정
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
