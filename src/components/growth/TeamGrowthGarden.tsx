"use client";

import { PlantGrowthCard } from "./PlantGrowthCard";

export type GrowthGardenMember = {
  id: string;
  name: string;
  feedbackCount: number;
  lastMeetingDate?: string;
  recentAction?: string;
};

type TeamGrowthGardenProps = {
  members: GrowthGardenMember[];
};

export function TeamGrowthGarden({ members }: TeamGrowthGardenProps) {
  if (members.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">우리 팀 성장 정원</h2>
        <p className="mt-1 text-sm text-slate-500">
          대화와 피드백이 쌓일수록 식물이 자랍니다
        </p>
        <p className="mt-6 text-center text-sm text-slate-500">
          팀원이 없습니다. 팀원을 추가하면 성장 정원이 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">우리 팀 성장 정원</h2>
        <p className="mt-1 text-sm text-slate-500">
          대화와 피드백이 쌓일수록 식물이 자랍니다
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <PlantGrowthCard
            key={m.id}
            employeeName={m.name}
            feedbackCount={m.feedbackCount}
            lastMeetingDate={m.lastMeetingDate}
            recentAction={m.recentAction}
          />
        ))}
      </div>
    </section>
  );
}
