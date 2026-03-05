import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { forbidden, getActorFromRequest, unauthorized } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toStartOfDay(input: string): number {
  const date = new Date(input);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

function toEndOfDay(input: string): number {
  const date = new Date(input);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

export async function GET(req: Request) {
  await ensureDbReady();
  const actor = getActorFromRequest(req);
  if (!actor) return unauthorized();
  if (actor.role !== "HR") return forbidden("HR만 접근 가능합니다.");

  const params = new URL(req.url).searchParams;
  const teamId = params.get("teamId") || "all";
  const managerId = params.get("managerId") || "all";
  const from = params.get("from");
  const to = params.get("to");

  const now = new Date();
  const thisMonth = monthKey(now);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = monthKey(prevDate);
  const fromTs = from ? toStartOfDay(from) : null;
  const toTs = to ? toEndOfDay(to) : null;

  const teams = db.teams.filter((t) => (teamId === "all" ? true : t.id === teamId));
  const managers = db.users.filter((u) => u.role === "MANAGER");
  const filteredManagers = managers.filter((m) => {
    if (teamId !== "all" && m.teamId !== teamId) return false;
    if (managerId !== "all" && m.id !== managerId) return false;
    return true;
  });

  const activity = filteredManagers.map((m) => {
    const managerLogs = db.logs.filter((l) => l.managerId === m.id);
    const thisCount = managerLogs.filter(
      (l) => monthKey(new Date(l.createdAt)) === thisMonth,
    ).length;
    const prevCount = managerLogs.filter(
      (l) => monthKey(new Date(l.createdAt)) === prevMonth,
    ).length;
    const teamMemberCount = db.employees.filter((e) => e.managerId === m.id).length || 1;

    return {
      managerId: m.id,
      managerName: m.name,
      teamId: m.teamId || "",
      thisMonthCount: thisCount,
      lastMonthCount: prevCount,
      avgPerMember: Number((thisCount / teamMemberCount).toFixed(2)),
    };
  });

  const types = ["praise", "growth", "improve", "coaching", "other"] as const;
  const scopedEmployees = db.employees.filter((e) => {
    if (teamId !== "all" && e.teamId !== teamId) return false;
    if (managerId !== "all" && e.managerId !== managerId) return false;
    return true;
  });
  const scopedEmployeeIds = new Set(scopedEmployees.map((e) => e.id));
  const scopedManagerIds = new Set(filteredManagers.map((m) => m.id));

  const scopedLogs = db.logs.filter((l) => {
    if (!scopedEmployeeIds.has(l.employeeId)) return false;
    if (!scopedManagerIds.has(l.managerId)) return false;
    return true;
  });

  const periodLogs = scopedLogs.filter((l) => {
    const ts = new Date(l.createdAt).getTime();
    if (fromTs && ts < fromTs) return false;
    if (toTs && ts > toTs) return false;
    return true;
  });

  const total = periodLogs.length || 1;
  const typeDistribution = types.map((type) => {
    const count = periodLogs.filter((l) => l.type === type).length;
    return {
      type,
      count,
      percent: Number(((count / total) * 100).toFixed(1)),
    };
  });

  const employeesWithFeedback = new Set(periodLogs.map((l) => l.employeeId));
  const totalEmployees = scopedEmployees.length;
  const summary = {
    totalLogs: periodLogs.length,
    activeManagers: new Set(periodLogs.map((l) => l.managerId)).size,
    employeesWithFeedback: employeesWithFeedback.size,
    totalEmployees,
    coverageRate:
      totalEmployees === 0
        ? 0
        : Number(((employeesWithFeedback.size / totalEmployees) * 100).toFixed(1)),
  };

  const employeesWithoutRecentCoaching = scopedEmployees
    .filter((e) => !employeesWithFeedback.has(e.id))
    .map((e) => {
      const managerName = db.users.find((u) => u.id === e.managerId)?.name || "-";
      const lastLogTs = scopedLogs
        .filter((l) => l.employeeId === e.id)
        .map((l) => new Date(l.createdAt).getTime())
        .sort((a, b) => b - a)[0];
      const daysSinceLastFeedback = lastLogTs ? Math.floor((Date.now() - lastLogTs) / DAY_MS) : -1;
      return {
        employeeId: e.id,
        employeeName: e.name,
        managerName,
        daysSinceLastFeedback,
      };
    })
    .sort((a, b) => b.daysSinceLastFeedback - a.daysSinceLastFeedback);

  const teamCoverage = teams.map((team) => {
    const employeesInTeam = scopedEmployees.filter((e) => e.teamId === team.id);
    const covered = employeesInTeam.filter((e) => employeesWithFeedback.has(e.id)).length;
    const totalMembers = employeesInTeam.length;
    const coverageRate =
      totalMembers === 0 ? 0 : Number(((covered / totalMembers) * 100).toFixed(1));
    return {
      teamId: team.id,
      teamName: team.name,
      covered,
      totalMembers,
      coverageRate,
    };
  });

  const rangeDays =
    fromTs && toTs ? Math.max(1, Math.ceil((toTs - fromTs) / DAY_MS)) : 30;
  const lowActivityManagers = filteredManagers
    .map((m) => {
      const teamMemberCount = scopedEmployees.filter((e) => e.managerId === m.id).length || 1;
      const managerPeriodLogs = periodLogs.filter((l) => l.managerId === m.id).length;
      const monthlyAvg = Number(
        ((managerPeriodLogs / teamMemberCount) * (30 / rangeDays)).toFixed(2),
      );
      const teamName = db.teams.find((t) => t.id === m.teamId)?.name || "-";
      return {
        managerId: m.id,
        managerName: m.name,
        teamName,
        avgPerMember: monthlyAvg,
      };
    })
    .filter((m) => m.avgPerMember < 1)
    .sort((a, b) => a.avgPerMember - b.avgPerMember);

  const recentActivity = periodLogs
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((l) => {
      const employeeName = db.employees.find((e) => e.id === l.employeeId)?.name || "-";
      const managerName = db.users.find((u) => u.id === l.managerId)?.name || "-";
      return {
        id: l.id,
        type: l.type,
        memo: l.memo,
        employeeName,
        managerName,
        createdAt: l.createdAt,
      };
    });

  return NextResponse.json({
    summary,
    activity,
    employeesWithoutRecentCoaching,
    teamCoverage,
    lowActivityManagers,
    typeDistribution,
    recentActivity,
    teams: db.teams,
    managers,
  });
}
