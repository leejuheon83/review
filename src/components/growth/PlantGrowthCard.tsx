"use client";

import {
  getPlantStage,
  getStageLabel,
  getStageMessage,
  getRemainingToNextStage,
} from "@/lib/growth";
import { PlantIllustration } from "./PlantIllustration";

type PlantGrowthCardProps = {
  employeeName: string;
  feedbackCount: number;
  lastMeetingDate?: string;
  recentAction?: string;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function PlantGrowthCard({
  employeeName,
  feedbackCount,
  lastMeetingDate,
  recentAction,
}: PlantGrowthCardProps) {
  const stage = getPlantStage(feedbackCount);
  const stageLabel = getStageLabel(stage);
  const message = getStageMessage(feedbackCount);
  const remaining = getRemainingToNextStage(feedbackCount);

  const level: "우수" | "보통" | "적음" = stage >= 3 ? "우수" : stage <= 1 ? "적음" : "보통";

  const cardClass = [
    "group flex gap-5 rounded-2xl border p-5 shadow-sm transition-all duration-300",
    level === "우수" && "border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 hover:shadow-md",
    level === "보통" && "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md",
    level === "적음" && "border-amber-300 bg-amber-50/40 hover:border-amber-400 hover:shadow-md",
  ]
    .filter(Boolean)
    .join(" ");

  const badgeClass = {
    우수: "bg-emerald-500 text-white",
    보통: "bg-slate-200 text-slate-700",
    적음: "bg-amber-500 text-white",
  };

  return (
    <article className={cardClass} role="article">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-slate-900">{employeeName}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass[level]}`}>
            {level}
          </span>
        </div>
        {lastMeetingDate && (
          <p className="mt-1 text-xs text-slate-500">
            최근 면담 {formatDate(lastMeetingDate)}
          </p>
        )}
        <p className="mt-2 whitespace-nowrap text-xs font-medium text-emerald-700">{message}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            피드백 {feedbackCount}건
          </span>
          {recentAction && (
            <span className="truncate text-xs text-slate-500">{recentAction}</span>
          )}
        </div>
      </div>
      <div className="-mt-2 flex shrink-0 flex-col items-center">
        <div className="h-[100px] w-[80px] transition-transform duration-300 group-hover:scale-105">
          <PlantIllustration stage={stage} className="h-full w-full" />
        </div>
        <p className="mt-1.5 text-xs font-medium text-slate-600">{stageLabel}</p>
        {remaining !== null && remaining > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">
            다음 단계까지 {remaining}건
          </p>
        )}
      </div>
    </article>
  );
}
