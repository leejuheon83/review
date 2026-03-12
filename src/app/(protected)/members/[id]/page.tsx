"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import type { Employee, FeedbackLog, FeedbackType, MemberNote, Summary } from "@/lib/types";

const tags = ["협업", "리더십", "책임감", "업무품질", "고객대응"];
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function typeLabel(type: FeedbackType): string {
  return (
    {
      praise: "칭찬",
      growth: "성장 피드백",
      improve: "개선 필요",
      coaching: "코칭",
      other: "기타",
    }[type] || type
  );
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const [member, setMember] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  const [note, setNote] = useState<MemberNote | null>(null);

  const [type, setType] = useState<FeedbackType>("coaching");
  const [memo, setMemo] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [editing, setEditing] = useState<FeedbackLog | null>(null);
  const [msg, setMsg] = useState("");

  const [filterType, setFilterType] = useState<"all" | FeedbackType>("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState<"30" | "90" | "all">("30");
  const [q, setQ] = useState("");
  const [pinOnly, setPinOnly] = useState(false);
  const [nextAction, setNextAction] = useState("");

  const [summaryFrom, setSummaryFrom] = useState(() => toDateInput(new Date(Date.now() - 29 * DAY_MS)));
  const [summaryTo, setSummaryTo] = useState(() => toDateInput(new Date()));
  const [summaryType, setSummaryType] = useState<"all" | FeedbackType>("all");
  const [summaryTag, setSummaryTag] = useState("all");
  const [aiSummary, setAiSummary] = useState<Summary | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<"idle" | "loading" | "cached" | "generated" | "insufficient">("idle");
  const [summaryUsedCount, setSummaryUsedCount] = useState(0);
  const [summaryUsedLogIds, setSummaryUsedLogIds] = useState<string[]>([]);
  const [summaryError, setSummaryError] = useState("");
  const [nowTs] = useState(() => Date.now());

  const refresh = async () => {
    const [memberRes, logsRes, noteRes] = await Promise.all([
      apiFetch<{ item: Employee }>(`/api/members/${employeeId}`),
      apiFetch<{ items: FeedbackLog[] }>(
        `/api/logs?employeeId=${employeeId}&type=${filterType}&tag=${filterTag}&period=${filterPeriod}&q=${encodeURIComponent(q)}`,
      ),
      apiFetch<{ item: MemberNote | null }>(`/api/member-notes/${employeeId}`),
    ]);
    setMember(memberRes.item);
    const baseLogs = pinOnly ? logsRes.items.filter((l) => l.pinned) : logsRes.items;
    setLogs(baseLogs);
    setNote(noteRes.item);
    setNextAction(noteRes.item?.nextAction || "");
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [memberRes, logsRes, noteRes] = await Promise.all([
        apiFetch<{ item: Employee }>(`/api/members/${employeeId}`),
        apiFetch<{ items: FeedbackLog[] }>(
          `/api/logs?employeeId=${employeeId}&type=${filterType}&tag=${filterTag}&period=${filterPeriod}&q=${encodeURIComponent(q)}`,
        ),
        apiFetch<{ item: MemberNote | null }>(`/api/member-notes/${employeeId}`),
      ]);
      if (cancelled) return;
      setMember(memberRes.item);
      const baseLogs = pinOnly ? logsRes.items.filter((l) => l.pinned) : logsRes.items;
      setLogs(baseLogs);
      setNote(noteRes.item);
      setNextAction(noteRes.item?.nextAction || "");
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [employeeId, filterType, filterTag, filterPeriod, q, pinOnly]);

  const summary = useMemo(() => {
    const recent30 = logs.filter((l) => nowTs - new Date(l.createdAt).getTime() <= 30 * DAY_MS);
    return {
      praise: recent30.filter((l) => l.type === "praise").length,
      growth: recent30.filter((l) => l.type === "growth").length,
      improve: recent30.filter((l) => l.type === "improve").length,
      coaching: recent30.filter((l) => l.type === "coaching").length,
      pinned: recent30.filter((l) => l.pinned).length,
    };
  }, [logs, nowTs]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await apiFetch("/api/logs", {
      method: "POST",
      body: JSON.stringify({ employeeId, type, memo, tags: selectedTags, pinned }),
    });
    setMemo("");
    setPinned(false);
    setSelectedTags([]);
    setMsg("저장 완료");
    await refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/logs/${id}`, { method: "DELETE" });
      await refresh();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "삭제에 실패했습니다. 저장소 설정을 확인해주세요.");
    }
  };

  const update = async () => {
    if (!editing) return;
    await apiFetch(`/api/logs/${editing.id}`, { method: "PATCH", body: JSON.stringify(editing) });
    setEditing(null);
    await refresh();
  };

  const saveNote = async () => {
    await apiFetch(`/api/member-notes/${employeeId}`, {
      method: "PATCH",
      body: JSON.stringify({ nextAction }),
    });
    setMsg("1:1 액션 저장 완료");
    await refresh();
  };

  const generateSummary = async (regenerate = false) => {
    setSummaryError("");
    setSummaryStatus("loading");
    try {
      const res = await apiFetch<{
        item: Summary;
        status: "cached" | "generated" | "insufficient";
        usedLogIds: string[];
        usedLogsCount: number;
      }>("/api/summaries/employee", {
        method: "POST",
        body: JSON.stringify({
          employeeId,
          startDate: summaryFrom,
          endDate: summaryTo,
          type: summaryType,
          tags: summaryTag === "all" ? [] : [summaryTag],
          regenerate,
        }),
      });
      setAiSummary(res.item);
      setSummaryStatus(res.status);
      setSummaryUsedLogIds(res.usedLogIds);
      setSummaryUsedCount(res.usedLogsCount);
    } catch (error) {
      setSummaryStatus("idle");
      setSummaryError(error instanceof Error ? error.message : "요약 생성 실패");
    }
  };

  const copySummary = async () => {
    if (!aiSummary?.summaryText) return;
    await navigator.clipboard.writeText(aiSummary.summaryText);
    setMsg("AI 요약을 복사했습니다.");
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500">팀원 &gt; {member?.name}</p>
        <h1 className="text-3xl font-bold text-slate-900">{member?.name}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="order-2 rounded-xl border bg-white p-4 lg:order-1">
          <h2 className="text-base font-semibold text-slate-900">팀원 요약</h2>
          <p className="mt-1 text-xs text-slate-500">최근 30일</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
            <p>칭찬 {summary.praise}</p><p>성장 {summary.growth}</p>
            <p>개선 {summary.improve}</p><p>코칭 {summary.coaching}</p>
            <p>⭐ 핀 {summary.pinned}</p>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-900">다음 액션</p>
            <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" />
            <button type="button" onClick={() => void saveNote()} className="mt-2 rounded-lg bg-[#0070C9] px-3 py-2 text-xs font-semibold text-white">저장</button>
            {note?.updatedAt ? <p className="mt-2 text-xs text-slate-400">업데이트: {new Date(note.updatedAt).toLocaleDateString()}</p> : null}
          </div>
        </aside>

        <section className="order-1 space-y-4 lg:order-2">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">AI 요약</h3>
            <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-4">
              <input type="date" value={summaryFrom} onChange={(e) => setSummaryFrom(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="date" value={summaryTo} onChange={(e) => setSummaryTo(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
              <select value={summaryType} onChange={(e) => setSummaryType(e.target.value as "all" | FeedbackType)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="all">전체 유형</option><option value="praise">칭찬</option><option value="growth">성장 피드백</option>
                <option value="improve">개선 필요</option><option value="coaching">코칭</option><option value="other">기타</option>
              </select>
              <select value={summaryTag} onChange={(e) => setSummaryTag(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="all">전체 태그</option>
                {tags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void generateSummary(false)} className="rounded-lg bg-[#0070C9] px-3 py-2 text-xs font-semibold text-white">요약 생성</button>
              <button type="button" onClick={() => void generateSummary(true)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs">재생성</button>
              <button type="button" onClick={() => void copySummary()} className="rounded-lg bg-slate-100 px-3 py-2 text-xs">복사</button>
            </div>
            {summaryStatus === "loading" ? <p className="mt-3 text-sm text-slate-500">요약 생성 중…</p> : null}
            {summaryError ? <p className="mt-3 text-sm text-rose-700">{summaryError}</p> : null}
            {aiSummary ? (
              <div className="mt-3 rounded-lg border bg-slate-50 p-3">
                <p className="whitespace-pre-wrap text-sm text-slate-800">{aiSummary.summaryText}</p>
                <p className="mt-2 text-xs text-slate-500">{summaryFrom} ~ {summaryTo} 기간, 피드백 {summaryUsedCount}건 기반{summaryStatus === "cached" ? " (캐시)" : ""}</p>
                <p className="mt-1 text-xs text-slate-500">AI가 작성한 요약이며, 원문 기록을 함께 참고해 주세요.</p>
              </div>
            ) : null}
          </div>

          <form onSubmit={submit} className="rounded-xl border bg-white p-4">
            <div className="grid gap-2 grid-cols-1 md:grid-cols-[150px_1fr]">
              <select value={type} onChange={(e) => setType(e.target.value as FeedbackType)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="praise">칭찬</option><option value="growth">성장 피드백</option><option value="improve">개선 필요</option><option value="coaching">코칭</option><option value="other">기타</option>
              </select>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className="rounded-lg border px-3 py-2 text-sm" placeholder="구체적 사례를 중심으로 5~200자" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag} type="button" onClick={() => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])} className={`rounded-full px-2.5 py-1 text-xs ${selectedTags.includes(tag) ? "bg-[#0070C9] text-white" : "bg-slate-100 text-slate-700"}`}>
                  #{tag}
                </button>
              ))}
              <label className="ml-2 flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />⭐ 핀</label>
            </div>
            <button className="mt-3 rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white">저장</button>
          </form>

          <div className="rounded-xl border bg-white p-4">
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | FeedbackType)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="all">전체 유형</option><option value="praise">칭찬</option><option value="growth">성장 피드백</option><option value="improve">개선 필요</option><option value="coaching">코칭</option><option value="other">기타</option>
              </select>
              <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="all">전체 태그</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value as "30" | "90" | "all")} className="rounded-lg border px-3 py-2 text-sm">
                <option value="30">최근 30일</option><option value="90">최근 90일</option><option value="all">전체</option>
              </select>
              <label className="flex items-center rounded-lg border px-3 py-2 text-sm text-slate-700"><input type="checkbox" checked={pinOnly} onChange={(e) => setPinOnly(e.target.checked)} className="mr-2" />핀만 보기</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="mt-3 divide-y rounded-lg border">
              {logs.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">아직 기록이 없습니다. 첫 코칭 로그를 남겨보세요.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`flex items-start justify-between gap-3 p-3 ${summaryUsedLogIds.includes(log.id) ? "bg-amber-50" : ""}`}>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm text-slate-800">
                        <span className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{typeLabel(log.type)}</span>
                        {log.memo}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(log.createdAt).toLocaleDateString()} · {log.tags.map((t) => `#${t}`).join(" ")}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setEditing(log)} className="rounded bg-slate-100 px-2 py-1 text-xs">편집</button>
                      <button type="button" onClick={() => void remove(log.id)} className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">삭제</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">피드백 편집</h3>
            <div className="mt-3 space-y-2">
              <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as FeedbackType })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="praise">칭찬</option><option value="growth">성장 피드백</option><option value="improve">개선 필요</option><option value="coaching">코칭</option><option value="other">기타</option>
              </select>
              <textarea value={editing.memo} onChange={(e) => setEditing({ ...editing, memo: e.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">취소</button>
              <button type="button" onClick={() => void update()} className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white">저장</button>
            </div>
          </div>
        </div>
      ) : null}

      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
    </div>
  );
}
