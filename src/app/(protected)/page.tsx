"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { buildLeadershipOverview } from "@/lib/leadership-overview";
import { validateQuickLogInput } from "@/lib/quick-log-validation";
import type { Employee, FeedbackLog, FeedbackType, LeadershipAssessment } from "@/lib/types";

const suggestionChips = [
  "회의 진행이 매우 좋았습니다.",
  "고객 커뮤니케이션이 명확했습니다.",
  "리포트 구조가 매우 명확했습니다.",
  "업무 우선순위 개선이 필요합니다.",
];
const monthlyTargetPerMember = 4;

function typeMeta(type: FeedbackType): { label: string; icon: string } {
  return (
    {
      praise: { label: "칭찬", icon: "👍" },
      growth: { label: "성장", icon: "📈" },
      improve: { label: "개선", icon: "⚠" },
      coaching: { label: "코칭", icon: "💬" },
      other: { label: "기타", icon: "📌" },
    }[type] || { label: type, icon: "•" }
  );
}

function typeBadge(type: FeedbackType): string {
  if (type === "praise") return "bg-emerald-100 text-emerald-700";
  if (type === "coaching") return "bg-blue-100 text-blue-700";
  if (type === "improve") return "bg-amber-100 text-amber-700";
  if (type === "growth") return "bg-violet-100 text-violet-700";
  return "bg-slate-100 text-slate-700";
}

export default function DashboardPage() {
  const { actor } = useActor();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentLogs, setRecentLogs] = useState<FeedbackLog[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<FeedbackLog[]>([]);
  const [latestLeadership, setLatestLeadership] = useState<LeadershipAssessment | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<FeedbackType | "">("coaching");
  const [memo, setMemo] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

  const [feedType, setFeedType] = useState<"all" | FeedbackType>("all");
  const [feedPeriod, setFeedPeriod] = useState<"30" | "90" | "all">("30");
  const [feedEmployeeId, setFeedEmployeeId] = useState("all");
  const [editing, setEditing] = useState<FeedbackLog | null>(null);
  const [nowTs] = useState(() => Date.now());

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);

  const load = async () => {
    const employeeQuery = feedEmployeeId !== "all" ? `&employeeId=${feedEmployeeId}` : "";
    const [membersRes, recentRes, monthlyRes, leadershipRes] = await Promise.all([
      apiFetch<{ items: Employee[] }>("/api/members"),
      apiFetch<{ items: FeedbackLog[] }>(
        `/api/logs?period=${feedPeriod}&type=${feedType}&sort=latest${employeeQuery}`,
      ),
      apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=30&type=all&sort=latest"),
      actor?.id
        ? apiFetch<{ items: LeadershipAssessment[] }>(
            `/api/leadership-assessments?ownerUid=${encodeURIComponent(actor.id)}`,
          )
        : Promise.resolve({ items: [] as LeadershipAssessment[] }),
    ]);
    const activeMembers = membersRes.items.filter((e) => e.active);
    setEmployees(activeMembers);
    setEmployeeId((prev) => prev || activeMembers[0]?.id || "");
    setRecentLogs(recentRes.items.slice(0, 20));
    setMonthlyLogs(monthlyRes.items);
    setLatestLeadership(leadershipRes.items[0] || null);
  };

  useEffect(() => {
    if (!actor || actor.role !== "MANAGER") return;
    let cancelled = false;
    const loadInEffect = async () => {
      const employeeQuery = feedEmployeeId !== "all" ? `&employeeId=${feedEmployeeId}` : "";
      const [membersRes, recentRes, monthlyRes, leadershipRes] = await Promise.all([
        apiFetch<{ items: Employee[] }>("/api/members"),
        apiFetch<{ items: FeedbackLog[] }>(
          `/api/logs?period=${feedPeriod}&type=${feedType}&sort=latest${employeeQuery}`,
        ),
        apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=30&type=all&sort=latest"),
        apiFetch<{ items: LeadershipAssessment[] }>(
          `/api/leadership-assessments?ownerUid=${encodeURIComponent(actor.id)}`,
        ),
      ]);
      if (cancelled) return;
      const activeMembers = membersRes.items.filter((e) => e.active);
      setEmployees(activeMembers);
      setEmployeeId((prev) => prev || activeMembers[0]?.id || "");
      setRecentLogs(recentRes.items.slice(0, 20));
      setMonthlyLogs(monthlyRes.items);
      setLatestLeadership(leadershipRes.items[0] || null);
    };
    void loadInEffect();
    return () => {
      cancelled = true;
    };
  }, [actor, feedEmployeeId, feedPeriod, feedType]);

  const leadershipOverview = useMemo(
    () => buildLeadershipOverview(latestLeadership),
    [latestLeadership],
  );

  const coverage = useMemo(() => {
    return employees.map((e) => {
      const count = monthlyLogs.filter((l) => l.employeeId === e.id).length;
      return { id: e.id, name: e.name, count, ratio: Math.min(1, count / monthlyTargetPerMember) };
    });
  }, [employees, monthlyLogs]);

  const summary = useMemo(() => {
    const monthLogs = monthlyLogs.filter(
      (l) => nowTs - new Date(l.createdAt).getTime() <= 31 * 24 * 60 * 60 * 1000,
    );
    return {
      total: monthLogs.length,
      praise: monthLogs.filter((l) => l.type === "praise").length,
      coaching: monthLogs.filter((l) => l.type === "coaching").length,
      improve: monthLogs.filter((l) => l.type === "improve").length,
    };
  }, [monthlyLogs, nowTs]);

  const submitQuickLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateQuickLogInput({ employeeId, type, memo });
    if (error) {
      setNoticeTone("error");
      setNotice(error);
      return;
    }
    try {
      await apiFetch("/api/logs", {
        method: "POST",
        body: JSON.stringify({ employeeId, type, memo: memo.trim(), tags: [], pinned: false }),
      });
      setMemo("");
      setNoticeTone("success");
      setNotice("저장 완료. 같은 팀원/다른 팀원으로 바로 이어서 기록할 수 있습니다.");
      await load();
    } catch (error) {
      setNoticeTone("error");
      setNotice(error instanceof Error ? error.message : "저장 중 문제가 발생했습니다.");
    }
  };

  const deleteLog = async (logId: string) => {
    if (!confirm("이 피드백을 삭제하시겠습니까?")) return;
    await apiFetch(`/api/logs/${logId}`, { method: "DELETE" });
    await load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await apiFetch(`/api/logs/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: editing.type,
        memo: editing.memo,
        tags: editing.tags,
        pinned: editing.pinned,
      }),
    });
    setEditing(null);
    await load();
  };

  if (actor?.role === "HR") {
    return (
      <div className="rounded-xl border bg-white p-5">
        <p className="text-base text-slate-700">
          HR 계정입니다.{" "}
          <Link href="/hr" className="font-semibold text-slate-900">
            HR 대시보드로 이동
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-white p-4 text-base text-slate-700">
        이번 주 코칭 기록을 남겨보세요. 이번 달 목표: 팀원당 {monthlyTargetPerMember}회
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">빠른 기록</h2>
          <form onSubmit={submitQuickLog} className="mt-3 space-y-3">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-base"
            >
              <option value="">팀원 선택</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-5 gap-2">
              {(["praise", "growth", "improve", "coaching", "other"] as FeedbackType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg px-2 py-2 text-sm ${
                    type === t ? "bg-[#0070C9] text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {typeMeta(t).icon} {typeMeta(t).label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-base"
              placeholder="구체적 사례를 한 줄로 남겨보세요. (5~200자)"
            />

            <div className="grid grid-cols-2 gap-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setMemo(chip)}
                  className="truncate whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[13px] text-slate-700 hover:bg-slate-200"
                >
                  {chip}
                </button>
              ))}
            </div>

            <button className="w-full rounded-lg bg-[#0070C9] px-4 py-2 text-base font-semibold text-white">
              기록 저장
            </button>
          </form>
          {notice ? (
            <p
              className={`mt-3 overflow-hidden text-ellipsis whitespace-nowrap text-sm ${
                noticeTone === "success" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {notice}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">팀 코칭 커버리지</h3>
            <div className="mt-3 space-y-2">
              {coverage.map((c) => (
                <div key={c.id} className="grid grid-cols-[110px_1fr_50px] items-center gap-2 text-base">
                  <span className="truncate text-slate-700">{c.name}</span>
                  <div className="h-2 overflow-hidden rounded bg-slate-200">
                    <div className="h-full bg-[#0070C9]" style={{ width: `${Math.round(c.ratio * 100)}%` }} />
                  </div>
                  <span className="text-sm text-slate-500">{c.count}/{monthlyTargetPerMember}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">팀장 활동 요약</h3>
            <p className="mt-1 text-sm text-slate-500">이번 달</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-base">
              <p className="rounded bg-slate-50 p-2 text-slate-700">전체 기록: {summary.total}</p>
              <p className="rounded bg-slate-50 p-2 text-slate-700">👍 칭찬: {summary.praise}</p>
              <p className="rounded bg-slate-50 p-2 text-slate-700">💬 코칭: {summary.coaching}</p>
              <p className="rounded bg-slate-50 p-2 text-slate-700">⚠ 개선: {summary.improve}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-900">내 리더십</h3>
            {leadershipOverview ? (
              <>
                <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">최근 저장 결과</p>
                  <p className="mt-1 text-4xl font-bold text-slate-900">{leadershipOverview.totalScore}</p>
                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {leadershipOverview.resultLabel}
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {leadershipOverview.categoryAverages.map((item) => (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-base">
                        <span className="text-slate-700">{item.category}</span>
                        <span className="font-semibold text-slate-900">{item.average} / 5</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#2563EB]"
                          style={{ width: `${(item.average / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">최근 저장된 리더십 진단이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">최근 피드백</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select value={feedType} onChange={(e) => setFeedType(e.target.value as "all" | FeedbackType)} className="rounded-lg border px-3 py-2 text-base">
            <option value="all">전체 유형</option>
            <option value="praise">칭찬</option>
            <option value="growth">성장</option>
            <option value="improve">개선</option>
            <option value="coaching">코칭</option>
            <option value="other">기타</option>
          </select>
          <select value={feedPeriod} onChange={(e) => setFeedPeriod(e.target.value as "30" | "90" | "all")} className="rounded-lg border px-3 py-2 text-base">
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
            <option value="all">전체</option>
          </select>
          <select value={feedEmployeeId} onChange={(e) => setFeedEmployeeId(e.target.value)} className="rounded-lg border px-3 py-2 text-base">
            <option value="all">전체 사람</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 divide-y rounded-lg border">
          {recentLogs.length === 0 ? (
            <p className="p-4 text-base text-slate-500">아직 피드백 기록이 없습니다. 첫 코칭 노트를 남겨보세요.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 p-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="text-base text-slate-800">
                    <span className={`mr-1 rounded px-1.5 py-0.5 text-sm ${typeBadge(log.type)}`}>
                      {typeMeta(log.type).icon} {typeMeta(log.type).label}
                    </span>
                    {log.memo}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {employeeMap.get(log.employeeId)} · {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setEditing(log)} className="rounded bg-slate-100 px-2 py-1 text-sm">
                    편집
                  </button>
                  <button type="button" onClick={() => void deleteLog(log.id)} className="rounded bg-rose-50 px-2 py-1 text-sm text-rose-700">
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <h3 className="text-xl font-semibold text-slate-900">피드백 편집</h3>
            <div className="mt-3 space-y-2">
              <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as FeedbackType })} className="w-full rounded-lg border px-3 py-2 text-base">
                <option value="praise">칭찬</option>
                <option value="growth">성장</option>
                <option value="improve">개선</option>
                <option value="coaching">코칭</option>
                <option value="other">기타</option>
              </select>
              <textarea rows={3} value={editing.memo} onChange={(e) => setEditing({ ...editing, memo: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-base" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-base">
                취소
              </button>
              <button type="button" onClick={() => void saveEdit()} className="rounded-lg bg-[#0070C9] px-4 py-2 text-base font-semibold text-white">
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
