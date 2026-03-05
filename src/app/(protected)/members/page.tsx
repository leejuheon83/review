"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { buildMemberFeedbackInsight } from "@/lib/member-feedback-insight";
import type { Employee, FeedbackLog } from "@/lib/types";

type RowStat = {
  lastDate: string;
  pinnedCount: number;
};

export default function MembersPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);

  const refresh = async () => {
    const [membersRes, logsRes] = await Promise.all([
      apiFetch<{ items: Employee[] }>("/api/members"),
      apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=all&type=all"),
    ]);
    setItems(membersRes.items);
    setLogs(logsRes.items);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [membersRes, logsRes] = await Promise.all([
        apiFetch<{ items: Employee[] }>("/api/members"),
        apiFetch<{ items: FeedbackLog[] }>("/api/logs?period=all&type=all"),
      ]);
      if (cancelled) return;
      setItems(membersRes.items);
      setLogs(logsRes.items);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statMap = useMemo(() => {
    const map = new Map<string, RowStat>();
    logs.forEach((log) => {
      const prev = map.get(log.employeeId) || { lastDate: "", pinnedCount: 0 };
      const current =
        !prev.lastDate || new Date(log.createdAt).getTime() > new Date(prev.lastDate).getTime()
          ? log.createdAt
          : prev.lastDate;
      map.set(log.employeeId, {
        lastDate: current,
        pinnedCount: prev.pinnedCount + (log.pinned ? 1 : 0),
      });
    });
    return map;
  }, [logs]);

  const selectedInsight = useMemo(() => {
    if (!selectedMember) return null;
    return buildMemberFeedbackInsight(logs.filter((log) => log.employeeId === selectedMember.id));
  }, [logs, selectedMember]);

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

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-base">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">직무</th>
              <th className="px-4 py-3">최근 피드백 날짜</th>
              <th className="px-4 py-3">핀 개수</th>
              <th className="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const stat = statMap.get(item.id);
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <button type="button" onClick={() => setSelectedMember(item)} className="hover:underline">
                      {item.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.role || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {stat?.lastDate ? new Date(stat.lastDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{stat?.pinnedCount || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(item)}
                      className={`rounded px-2 py-1 text-sm font-semibold ${
                        item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.active ? "활성" : "비활성"}
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

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
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

            <div className="mt-5 rounded-xl bg-[#F4F8FD] p-4">
              <p className="text-sm font-semibold text-[#1F4E79]">누적 피드백 요약</p>
              <p className="mt-2 text-base leading-7 text-slate-700">{selectedInsight?.briefSummary}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">추천 멘트</p>
                <p className="mt-2 text-base leading-7 text-slate-700">{selectedInsight?.recommendedMent}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">액션 플랜</p>
                <p className="mt-2 text-base leading-7 text-slate-700">{selectedInsight?.nextActionPlan}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
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
    </div>
  );
}
