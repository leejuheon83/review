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
        aiSummary: (initial?.aiSummary as string) || "",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900";
  const textareaClass = `${inputClass} min-h-[120px]`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">기본 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">팀원 선택</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={inputClass}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">면담일</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className={inputClass}
              />
              {errors.meetingDate && <p className="mt-1 text-xs text-rose-600">{errors.meetingDate}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">면담 유형</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className={inputClass}
              >
                {MEETING_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.meetingType && <p className="mt-1 text-xs text-rose-600">{errors.meetingType}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">면담 내용</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">목표 요약</label>
            <p className="mb-2 text-xs text-slate-500">팀원이 맡고 있는 업무</p>
            <textarea
              value={goalSummary}
              onChange={(e) => setGoalSummary(e.target.value)}
              rows={4}
              placeholder="팀원이 맡고 있는 업무를 입력하세요"
              className={textareaClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">주요 논의 내용</label>
            <textarea
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              rows={5}
              placeholder="면담에서 논의한 주요 내용을 입력하세요"
              className={textareaClass}
            />
            {errors.discussionNotes && <p className="mt-1 text-xs text-rose-600">{errors.discussionNotes}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">팀장 코멘트</label>
            <textarea
              value={managerComment}
              onChange={(e) => setManagerComment(e.target.value)}
              rows={4}
              placeholder="팀장 관점의 코멘트"
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">후속 사항</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">지원 필요 사항</label>
            <textarea
              value={supportNeeded}
              onChange={(e) => setSupportNeeded(e.target.value)}
              rows={4}
              placeholder="교육, 리소스, 협업, 우선순위 조정 등"
              className={textareaClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">합의된 액션</label>
            <textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              rows={4}
              placeholder="다음 액션 아이템"
              className={textareaClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">다음 면담 예정일</label>
            <input
              type="date"
              value={nextMeetingDate}
              onChange={(e) => setNextMeetingDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
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
