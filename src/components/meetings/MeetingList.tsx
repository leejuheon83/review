"use client";

import type { Meeting, MeetingType } from "@/types/meeting";
import { MeetingCard } from "./MeetingCard";

type MeetingListProps = {
  meetings: Meeting[];
  emptyMessage?: string;
  onDelete?: (id: string) => Promise<void>;
};

export function MeetingList({ meetings, emptyMessage = "아직 등록된 면담 기록이 없습니다.", onDelete }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
        <p className="mt-2 text-sm text-slate-400">면담 기록 작성 버튼을 눌러 첫 기록을 남겨보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} onDelete={onDelete} />
      ))}
    </div>
  );
}
