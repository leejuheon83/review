"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Meeting } from "@/types/meeting";
import { MEETING_TYPE_LABELS } from "@/types/meeting";
import { formatMeetingDate } from "@/lib/meetings";

type MeetingStatusPanelProps = {
  totalMembers: number;
  recentMeetings: Meeting[];
  recentMeetingCount: number;
  /** 팀원 중 최근 N일 이내 면담이 없는 인원 수 */
  noRecentMeetingCount: number;
};

const RECENT_DAYS = 30;

export function MeetingStatusPanel({
  totalMembers,
  recentMeetings,
  recentMeetingCount,
  noRecentMeetingCount,
}: MeetingStatusPanelProps) {
  const router = useRouter();

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-slate-900">1:1 면담 현황</h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">전체 팀원</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{totalMembers}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">최근 {RECENT_DAYS}일 면담</p>
          <p className="mt-1 text-xl font-bold text-emerald-800">{recentMeetingCount}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs text-amber-700">미면담 인원</p>
          <p className="mt-1 text-xl font-bold text-amber-800">{noRecentMeetingCount}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500">최근 면담 5건</p>
        <ul className="mt-2 space-y-1">
          {recentMeetings.slice(0, 5).map((m) => {
            const d = "toDate" in m.meetingDate ? m.meetingDate.toDate() : new Date(m.meetingDate as unknown as string);
            return (
              <li key={m.id}>
                <Link
                  href={`/meetings/${m.id}`}
                  className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {m.employeeName} · {MEETING_TYPE_LABELS[m.meetingType]} · {formatMeetingDate(d)}
                </Link>
              </li>
            );
          })}
        </ul>
        {recentMeetings.length === 0 && (
          <p className="mt-2 text-sm text-slate-400">면담 기록이 없습니다.</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => router.push("/meetings")}
        className="mt-4 block w-full text-center text-sm font-medium text-[#0070C9] hover:underline"
      >
        1:1 면담 기록 보기
      </button>
    </div>
  );
}
