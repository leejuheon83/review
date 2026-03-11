"use client";

import { useState } from "react";
import type { Employee } from "@/lib/types";
import type { Meeting, MeetingFormData, MeetingType } from "@/types/meeting";
import { MEETING_TYPE_OPTIONS } from "@/types/meeting";

type MeetingFormProps = {
  employees: Employee[];
  managerId: string;
  managerName: string;
  initial?: Partial<Meeting>;
  onSubmit: (input: MeetingFormData) => Promise<void>;
  onCancel: () => void;
};

export function MeetingForm({
  employees,
  managerId,
  managerName,
  initial,
  onSubmit,
  onCancel,
}: MeetingFormProps) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId || "");
  const [meetingDate, setMeetingDate] = useState(
    initial?.meetingDate
      ? (() => {
          const v = initial.meetingDate;
          const d = v && typeof v === "object" && "toDate" in v ? (v as { toDate: () => Date }).toDate() : new Date(v as string);
          return d.toISOString().slice(0, 10);
        })()
      : new Date().toISOString().slice(0, 10),
  );
  const [meetingType, setMeetingType] = useState<MeetingType>(initial?.meetingType || "coaching");
  const [goalSummary, setGoalSummary] = useState(initial?.goalSummary || "");
  const [discussionNotes, setDiscussionNotes] = useState(initial?.discussionNotes || "");
  const [managerComment, setManagerComment] = useState(initial?.managerComment || "");
  const [supportNeeded, setSupportNeeded] = useState(initial?.supportNeeded || "");
  const [actionItems, setActionItems] = useState(initial?.actionItems || "");
  const [nextMeetingDate, setNextMeetingDate] = useState(
    initial?.nextMeetingDate
      ? (() => {
          const v = initial.nextMeetingDate;
          const d = v && typeof v === "object" && "toDate" in v ? (v as { toDate: () => Date }).toDate() : new Date(v as string);
          return d.toISOString().slice(0, 10);
        })()
      : "",
  );
  const [aiSummary, setAiSummary] = useState(initial?.aiSummary || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!employeeId) e.employeeId = "팀원을 선택해주세요.";
    if (!meetingDate) e.meetingDate = "면담일을 입력해주세요.";
    if (!meetingType) e.meetingType = "면담 유형을 선택해주세요.";
    if (!discussionNotes.trim()) e.discussionNotes = "주요 논의 내용을 입력해주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const emp = employees.find((x) => x.id === employeeId);
      await onSubmit({
        managerId,
        managerName,
        employeeId,
        employeeName: emp?.name || "",
        meetingType,
        meetingDate: new Date(meetingDate),
        goalSummary: goalSummary.trim(),
        discussionNotes: discussionNotes.trim(),
        managerComment: managerComment.trim(),
        supportNeeded: supportNeeded.trim(),
        actionItems: actionItems.trim(),
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
        aiSummary: aiSummary.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">팀원 선택</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">선택</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="mt-1 text-xs text-rose-600">{errors.employeeId}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">면담일</label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          {errors.meetingDate && <p className="mt-1 text-xs text-rose-600">{errors.meetingDate}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">면담 유형</label>
        <select
          value={meetingType}
          onChange={(e) => setMeetingType(e.target.value as MeetingType)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        >
          {MEETING_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.meetingType && <p className="mt-1 text-xs text-rose-600">{errors.meetingType}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">외부 목표 요약</label>
        <textarea
          value={goalSummary}
          onChange={(e) => setGoalSummary(e.target.value)}
          rows={3}
          placeholder="외부 목표관리 시스템의 내용을 요약해 입력하세요"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">주요 논의 내용</label>
        <textarea
          value={discussionNotes}
          onChange={(e) => setDiscussionNotes(e.target.value)}
          rows={4}
          placeholder="면담에서 논의한 주요 내용을 입력하세요"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        {errors.discussionNotes && <p className="mt-1 text-xs text-rose-600">{errors.discussionNotes}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">팀장 코멘트</label>
        <textarea
          value={managerComment}
          onChange={(e) => setManagerComment(e.target.value)}
          rows={3}
          placeholder="팀장 관점의 코멘트"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">지원 필요 사항</label>
        <textarea
          value={supportNeeded}
          onChange={(e) => setSupportNeeded(e.target.value)}
          rows={3}
          placeholder="교육, 리소스, 협업, 우선순위 조정 등"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">합의된 액션</label>
        <textarea
          value={actionItems}
          onChange={(e) => setActionItems(e.target.value)}
          rows={3}
          placeholder="다음 액션 아이템"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">다음 면담 예정일</label>
        <input
          type="date"
          value={nextMeetingDate}
          onChange={(e) => setNextMeetingDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">AI 요약</label>
        <input
          type="text"
          value={aiSummary}
          onChange={(e) => setAiSummary(e.target.value)}
          placeholder="(선택) AI 요약 또는 수동 입력"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0070C9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0059A8] disabled:opacity-60"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
