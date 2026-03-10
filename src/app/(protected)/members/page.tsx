"use client";

import { useEffect, useMemo, useState } from "react";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { buildLeadershipOverview } from "@/lib/leadership-overview";
import { buildMemberFeedbackInsight } from "@/lib/member-feedback-insight";
import { buildMemberFeedbackStatMap } from "@/lib/member-feedback-stats";
import type { Employee, FeedbackLog, FeedbackType, LeadershipAssessment } from "@/lib/types";

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  praise: "칭찬",
  growth: "성장",
  improve: "개선",
  coaching: "코칭",
  other: "기타",
};

/** 문장 단위로 나누어 가독성 높은 단락으로 렌더링 */
function formatReadableParagraphs(text: string): React.ReactNode {
  const parts = text
    .split(/(?<=[다요습니다])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length <= 1) return <p>{text}</p>;
  return (
    <>
      {parts.map((para, i) => (
        <p key={i} className={i > 0 ? "pt-2" : undefined}>
          {para}
        </p>
      ))}
    </>
  );
}

function StatCell({
  count,
  onClick,
}: {
  item: Employee;
  type: FeedbackType;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left hover:underline ${count > 0 ? "font-medium text-[#0070C9] hover:text-[#0059A8]" : "text-slate-500"}`}
    >
      {count}
    </button>
  );
}

export default function MembersPage() {
  const { actor } = useActor();
  const [items, setItems] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  const [leadershipLatest, setLeadershipLatest] = useState<LeadershipAssessment | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Employee | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [logListModal, setLogListModal] = useState<{ employee: Employee; type: FeedbackType } | null>(null);

  const refresh = async () => {
    const requestList: Array<Promise<unknown>> = [
      apiFetch<{ items: Employee[] }>("/api/members"),
      apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=all&type=all"),
    ];
    if (actor?.id) {
      requestList.push(
        apiFetch<{ items: LeadershipAssessment[] }>(
          `/api/leadership-assessments?ownerUid=${encodeURIComponent(actor.id)}`,
        ),
      );
    }
    const [membersRes, logsRes, leadershipRes] = (await Promise.all(requestList)) as [
      { items: Employee[] },
      { items: FeedbackLog[] },
      { items: LeadershipAssessment[] } | undefined,
    ];
    setItems(membersRes.items);
    setLogs(logsRes.items);
    setLeadershipLatest(leadershipRes?.items?.[0] || null);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [membersRes, logsRes, leadershipRes] = (await Promise.all([
        apiFetch<{ items: Employee[] }>("/api/members"),
        apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=all&type=all"),
        actor?.id
          ? apiFetch<{ items: LeadershipAssessment[] }>(
              `/api/leadership-assessments?ownerUid=${encodeURIComponent(actor.id)}`,
            )
          : Promise.resolve(undefined),
      ])) as [{ items: Employee[] }, { items: FeedbackLog[] }, { items: LeadershipAssessment[] } | undefined];
      if (cancelled) return;
      setItems(membersRes.items);
      setLogs(logsRes.items);
      setLeadershipLatest(leadershipRes?.items?.[0] || null);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [actor?.id]);

  const statMap = useMemo(() => {
    return buildMemberFeedbackStatMap(logs);
  }, [logs]);

  const leadershipSignal = useMemo(() => {
    const overview = buildLeadershipOverview(leadershipLatest);
    if (!overview) return null;
    const sorted = overview.categoryAverages.slice().sort((a, b) => b.average - a.average);
    return {
      totalScore: overview.totalScore,
      resultLabel: overview.resultLabel,
      strengthCategory: sorted[0]?.category || "신뢰/동기부여",
      focusCategory: sorted[sorted.length - 1]?.category || "코칭/성장",
    };
  }, [leadershipLatest]);

  const selectedInsight = useMemo(() => {
    if (!selectedMember) return null;
    return buildMemberFeedbackInsight(
      logs.filter((log) => log.employeeId === selectedMember.id),
      leadershipSignal,
    );
  }, [logs, leadershipSignal, selectedMember]);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    await apiFetch("/api/members", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), role: role.trim() }),
    });
    setName("");
    setRole("");
    setOpen(false);
    setMessage("팀원을 추가했습니다.");
    await refresh();
  };

  const toggleActive = async (item: Employee) => {
    await apiFetch(`/api/members/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !item.active }),
    });
    await refresh();
  };

  const openEditModal = (item: Employee) => {
    setEditingMember(item);
    setEditName(item.name);
    setEditRole(item.role || "");
    setEditOpen(true);
  };

  const onEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;

    await apiFetch(`/api/members/${editingMember.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: editName,
        role: editRole,
      }),
    });

    setEditOpen(false);
    setEditingMember(null);
    setMessage("팀원 정보를 수정했습니다.");
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">팀원 관리</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#0070C9] px-4 py-2 text-base font-semibold text-white"
        >
          + 팀원 추가
        </button>
      </div>
      {message ? <p className="text-base text-emerald-700">{message}</p> : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[640px] text-sm sm:text-base">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">이름</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden md:table-cell">직무</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden lg:table-cell">최근 피드백</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">칭찬</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">성장</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">개선</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">코칭</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">상태</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const stat = statMap.get(item.id);
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-medium text-slate-900">
                    <button type="button" onClick={() => setSelectedMember(item)} className="hover:underline text-left">
                      {item.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-700 hidden md:table-cell">{item.role || "-"}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-700 hidden lg:table-cell">
                    {stat?.lastDate ? new Date(stat.lastDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <StatCell
                      item={item}
                      type="praise"
                      count={stat?.praiseCount || 0}
                      onClick={() => setLogListModal({ employee: item, type: "praise" })}
                    />
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">
                    <StatCell
                      item={item}
                      type="growth"
                      count={stat?.growthCount || 0}
                      onClick={() => setLogListModal({ employee: item, type: "growth" })}
                    />
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">
                    <StatCell
                      item={item}
                      type="improve"
                      count={stat?.improveCount || 0}
                      onClick={() => setLogListModal({ employee: item, type: "improve" })}
                    />
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <StatCell
                      item={item}
                      type="coaching"
                      count={stat?.coachingCount || 0}
                      onClick={() => setLogListModal({ employee: item, type: "coaching" })}
                    />
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(item)}
                      className={`rounded px-2 py-1.5 text-xs sm:text-sm font-semibold touch-target ${
                        item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200 touch-target"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">
        * 팀원 클릭시 피드백 요약 및 추천 코칭 멘트가 팝업으로 활성화 됩니다.
      </p>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <form onSubmit={onCreate} className="w-full max-w-md rounded-xl bg-white p-5">
            <h3 className="text-xl font-semibold text-slate-900">팀원 추가</h3>
            <div className="mt-3 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="이름 (필수)"
                className="w-full rounded-lg border px-3 py-2 text-base"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="직무 (선택)"
                className="w-full rounded-lg border px-3 py-2 text-base"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-base">
                취소
              </button>
              <button className="rounded-lg bg-[#0070C9] px-4 py-2 text-base font-semibold text-white">
                저장
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {editOpen && editingMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <form onSubmit={onEdit} className="w-full max-w-md rounded-xl bg-white p-5">
            <h3 className="text-xl font-semibold text-slate-900">팀원 정보 수정</h3>
            <div className="mt-3 space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                placeholder="이름 (필수)"
                className="w-full rounded-lg border px-3 py-2 text-base"
              />
              <input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="직무 (선택)"
                className="w-full rounded-lg border px-3 py-2 text-base"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false);
                  setEditingMember(null);
                }}
                className="rounded-lg bg-slate-100 px-4 py-2 text-base"
              >
                취소
              </button>
              <button className="rounded-lg bg-[#0070C9] px-4 py-2 text-base font-semibold text-white">
                저장
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{selectedMember.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">직무: {selectedMember.role || "-"}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-medium ${
                      selectedMember.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    상태: {selectedMember.active ? "활성" : "비활성"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mt-5 rounded-xl bg-[#F4F8FD] p-4">
                <p className="text-sm font-semibold text-[#1F4E79]">누적 피드백 요약</p>
                <p className="mt-2 text-base leading-7 text-slate-700">{selectedInsight?.briefSummary}</p>
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                <div className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-blue-800">추천 멘트</p>
                  </div>
                  <div className="space-y-3 text-[15px] leading-[1.8] text-slate-700">
                    {selectedInsight?.recommendedMent
                      ? formatReadableParagraphs(selectedInsight.recommendedMent)
                      : null}
                  </div>
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-amber-800">액션 플랜</p>
                  </div>
                  <div className="space-y-3 text-[15px] leading-[1.8] text-slate-700">
                    {selectedInsight?.nextActionPlan
                      ? formatReadableParagraphs(selectedInsight.nextActionPlan)
                      : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {logListModal ? (
        <LogListModal
          employee={logListModal.employee}
          type={logListModal.type}
          logs={logs.filter((l) => l.employeeId === logListModal.employee.id && l.type === logListModal.type)}
          onClose={() => setLogListModal(null)}
        />
      ) : null}
    </div>
  );
}

function LogListModal({
  employee,
  type,
  logs,
  onClose,
}: {
  employee: Employee;
  type: FeedbackType;
  logs: FeedbackLog[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {employee.name} - {FEEDBACK_TYPE_LABELS[type]} 기록 ({logs.length}건)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-slate-500">해당 유형의 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {logs
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((log) => (
                  <li key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-base text-slate-800">{log.memo}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {new Date(log.createdAt).toLocaleDateString("ko-KR")}
                      {Array.isArray(log.tags) && log.tags.length > 0 ? ` · ${log.tags.map((t) => `#${t}`).join(" ")}` : ""}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div className="border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-slate-100 px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
