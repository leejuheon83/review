"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useActor } from "@/components/actor-provider";
import { apiFetch } from "@/lib/client-api";
import { getMeetingById, updateMeeting } from "@/lib/meetings";
import { MOCK_TEAM_MEMBERS } from "@/lib/mockTeamMembers";
import type { Employee } from "@/lib/types";
import type { Meeting, MeetingFormData } from "@/types/meeting";
import { MeetingForm } from "@/components/meetings/MeetingForm";

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { actor } = useActor();
  const id = params.id as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const managerId = actor?.id || "";
  const managerName = actor?.name || "";

  useEffect(() => {
    apiFetch<{ items: Employee[] }>("/api/members")
      .then((res) => setEmployees(res.items?.length ? res.items : MOCK_TEAM_MEMBERS))
      .catch(() => setEmployees(MOCK_TEAM_MEMBERS));

    getMeetingById(id)
      .then((m) => setMeeting(m || null))
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (input: MeetingFormData) => {
    setSubmitError(null);
    try {
      await updateMeeting(id, input);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("meeting-toast", "면담 기록이 수정되었습니다.");
      }
      router.push("/meetings");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "수정에 실패했습니다.");
    }
  };

  const handleCancel = () => router.push(`/meetings/${id}`);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-slate-500">
        불러오는 중...
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error || "면담 기록을 찾을 수 없습니다."}
        <Link href="/meetings" className="mt-4 block text-sm font-medium underline">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">면담 기록 수정</h1>
      {submitError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <MeetingForm
          employees={employees}
          managerId={managerId}
          managerName={managerName}
          initial={meeting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
