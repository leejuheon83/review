"use client";

import { useEffect, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";

type ActivityRow = {
  managerId: string;
  managerName: string;
  teamId: string;
  thisMonthCount: number;
  lastMonthCount: number;
  avgPerMember: number;
};
type DistRow = { type: string; count: number; percent: number };
type Team = { id: string; name: string };
type Manager = { id: string; name: string };
type Summary = {
  totalLogs: number;
  activeManagers: number;
  employeesWithFeedback: number;
  totalEmployees: number;
  coverageRate: number;
};
type MissingEmployee = {
  employeeId: string;
  employeeName: string;
  managerName: string;
  daysSinceLastFeedback: number;
};
type TeamCoverage = {
  teamId: string;
  teamName: string;
  covered: number;
  totalMembers: number;
  coverageRate: number;
};
type LowActivityManager = {
  managerId: string;
  managerName: string;
  teamName: string;
  avgPerMember: number;
};
type RecentActivity = {
  id: string;
  type: string;
  memo: string;
  employeeName: string;
  managerName: string;
  createdAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const BLUE = "#0070C9";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function feedbackTypeLabel(type: string): string {
  if (type === "praise") return "👍 칭찬";
  if (type === "growth") return "📈 성장";
  if (type === "improve") return "⚠ 개선";
  if (type === "coaching") return "💬 코칭";
  return "📌 기타";
}

export default function HrDashboardPage() {
  const { actor } = useActor();
  const [summary, setSummary] = useState<Summary>({
    totalLogs: 0,
    activeManagers: 0,
    employeesWithFeedback: 0,
    totalEmployees: 0,
    coverageRate: 0,
  });
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [dist, setDist] = useState<DistRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [missingEmployees, setMissingEmployees] = useState<MissingEmployee[]>([]);
  const [teamCoverage, setTeamCoverage] = useState<TeamCoverage[]>([]);
  const [lowManagers, setLowManagers] = useState<LowActivityManager[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentActivity[]>([]);

  const [teamId, setTeamId] = useState("all");
  const [managerId, setManagerId] = useState("all");
  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 29 * DAY_MS)));
  const [to, setTo] = useState(() => toDateInput(new Date()));
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (actor?.role !== "HR") return;
    const load = async () => {
      const query = `/api/hr/summary?teamId=${teamId}&managerId=${managerId}&from=${from}&to=${to}`;
      const res = await apiFetch<{
        summary: Summary;
        activity: ActivityRow[];
        employeesWithoutRecentCoaching: MissingEmployee[];
        teamCoverage: TeamCoverage[];
        lowActivityManagers: LowActivityManager[];
        typeDistribution: DistRow[];
        recentActivity: RecentActivity[];
        teams: Team[];
        managers: Manager[];
      }>(query);
      setSummary(res.summary);
      setActivity(res.activity);
      setMissingEmployees(res.employeesWithoutRecentCoaching);
      setTeamCoverage(res.teamCoverage);
      setLowManagers(res.lowActivityManagers);
      setDist(res.typeDistribution);
      setRecentLogs(res.recentActivity);
      setTeams(res.teams);
      setManagers(res.managers);
    };
    void load();
  }, [actor, teamId, managerId, from, to]);

  if (actor?.role !== "HR") {
    return <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">HR만 접근 가능합니다.</div>;
  }

  const csvExportUrl = `/api/hr/export?teamId=${teamId}&managerId=${managerId}&employeeId=all&from=${from}&to=${to}&format=csv`;
  const excelExportUrl = `/api/hr/export?teamId=${teamId}&managerId=${managerId}&employeeId=all&from=${from}&to=${to}&format=xls`;

  const downloadWithAuth = async (url: string, filename: string) => {
    try {
      setExportError("");
      const actorId = window.localStorage.getItem("coaching-log-actor-id") || actor?.id || "";
      const res = await fetch(url, {
        headers: {
          "x-actor-id": actorId,
        },
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "다운로드에 실패했습니다." }))) as {
          error?: string;
        };
        throw new Error(err.error || "다운로드에 실패했습니다.");
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">HR 대시보드</h1>
        <p className="mt-1 text-sm text-slate-600">팀장 활동과 코칭 공백을 빠르게 확인하세요.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">필터</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">전체 팀</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">전체 팀장</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">전체 피드백 로그</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalLogs}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">활동 팀장 수</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary.activeManagers}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">피드백 받은 팀원</p><p className="mt-2 text-3xl font-bold text-slate-900">{summary.employeesWithFeedback} / {summary.totalEmployees}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">코칭 커버리지</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.coverageRate}%</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-200"><div className="h-full rounded" style={{ width: `${summary.coverageRate}%`, backgroundColor: BLUE }} /></div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">최근 코칭 미수신 팀원</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          {missingEmployees.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">선택한 기간 내 모든 팀원이 피드백을 받았습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr><th className="px-3 py-2">팀원</th><th className="px-3 py-2">팀장</th><th className="px-3 py-2">마지막 피드백 이후</th></tr>
              </thead>
              <tbody>
                {missingEmployees.map((item) => (
                  <tr key={item.employeeId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{item.employeeName}</td>
                    <td className="px-3 py-2">{item.managerName}</td>
                    <td className="px-3 py-2">{item.daysSinceLastFeedback < 0 ? "기록 없음" : `${item.daysSinceLastFeedback}일`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">팀장 활동률</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr><th className="px-3 py-2">팀장</th><th className="px-3 py-2">이번 달</th><th className="px-3 py-2">지난 달</th><th className="px-3 py-2">팀원 1인당 월 평균</th></tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.managerId} className="border-t border-slate-100">
                  <td className="px-3 py-2">{a.managerName}</td>
                  <td className="px-3 py-2">{a.thisMonthCount}</td>
                  <td className="px-3 py-2">{a.lastMonthCount}</td>
                  <td className="px-3 py-2">{a.avgPerMember}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">저활동 팀장</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          {lowManagers.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">저활동 팀장이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr><th className="px-3 py-2">팀장</th><th className="px-3 py-2">팀</th><th className="px-3 py-2">팀원 1인당 월 평균</th></tr>
              </thead>
              <tbody>
                {lowManagers.map((m) => (
                  <tr key={m.managerId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{m.managerName}</td>
                    <td className="px-3 py-2">{m.teamName}</td>
                    <td className="px-3 py-2 font-semibold text-rose-700">{m.avgPerMember}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">팀 코칭 커버리지</h2>
        <div className="mt-3 space-y-3">
          {teamCoverage.map((team) => (
            <div key={team.teamId} className="rounded-xl border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{team.teamName}</span>
                <span className="text-slate-600">{team.coverageRate}% ({team.covered}/{team.totalMembers})</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full" style={{ width: `${team.coverageRate}%`, backgroundColor: BLUE }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">피드백 유형 분포</h2>
        <div className="mt-3 space-y-3">
          {dist.map((d) => (
            <div key={d.type} className="rounded-xl border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{feedbackTypeLabel(d.type)}</span>
                <span className="text-slate-600">{d.percent}% ({d.count})</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full" style={{ width: `${d.percent}%`, backgroundColor: BLUE }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">최근 코칭 활동</h2>
        <div className="mt-3 divide-y rounded-xl border border-slate-200">
          {recentLogs.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">선택한 기간 내 코칭 활동이 없습니다.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-50">
                <p className="text-sm font-medium text-slate-900">{feedbackTypeLabel(log.type)}</p>
                <p className="mt-1 text-sm text-slate-700">{log.memo}</p>
                <p className="mt-1 text-xs text-slate-500">{log.employeeName} · {log.managerName} · {new Date(log.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">내보내기</h2>
        <p className="mt-1 text-sm text-slate-600">기간/팀/팀장 필터를 적용한 후 CSV 또는 엑셀 파일로 다운로드하세요.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadWithAuth(excelExportUrl, "coaching-logs.xls")}
            className="inline-block rounded-xl bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005FA8]"
          >
            엑셀 다운로드
          </button>
          <button
            type="button"
            onClick={() => void downloadWithAuth(csvExportUrl, "coaching-logs.csv")}
            className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            CSV 다운로드
          </button>
        </div>
        {exportError ? <p className="mt-2 text-sm text-rose-600">{exportError}</p> : null}
      </section>
    </div>
  );
}
