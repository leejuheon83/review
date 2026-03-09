import type { FeedbackLog } from "@/lib/types";

export type MemberFeedbackStat = {
  lastDate: string;
  praiseCount: number;
  growthCount: number;
  improveCount: number;
  coachingCount: number;
};

export function buildMemberFeedbackStatMap(logs: FeedbackLog[]) {
  const map = new Map<string, MemberFeedbackStat>();

  logs.forEach((log) => {
    const prev = map.get(log.employeeId) || {
      lastDate: "",
      praiseCount: 0,
      growthCount: 0,
      improveCount: 0,
      coachingCount: 0,
    };
    const current =
      !prev.lastDate || new Date(log.createdAt).getTime() > new Date(prev.lastDate).getTime()
        ? log.createdAt
        : prev.lastDate;

    map.set(log.employeeId, {
      lastDate: current,
      praiseCount: prev.praiseCount + (log.type === "praise" ? 1 : 0),
      growthCount: prev.growthCount + (log.type === "growth" ? 1 : 0),
      improveCount: prev.improveCount + (log.type === "improve" ? 1 : 0),
      coachingCount: prev.coachingCount + (log.type === "coaching" ? 1 : 0),
    });
  });

  return map;
}
